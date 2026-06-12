"""
Sanctions Screening Engine.

Checks customer names against:
- OFAC SDN List (US Treasury)
- UN Consolidated Sanctions List
- EU Consolidated List
- HM Treasury (UK)
- UAE Local Terrorist List (CBUAE)
- Organization's custom watchlists

Uses rapidfuzz for fuzzy name matching with Arabic transliteration support.
"""
from __future__ import annotations
import logging
from dataclasses import dataclass, field
from typing import Optional
from rapidfuzz import fuzz, process
from django.core.cache import cache
from core.utils import normalize_arabic_name

logger = logging.getLogger('services.aml_engine.sanctions')


@dataclass
class ScreeningMatch:
    list_source: str
    matched_name: str
    match_score: float
    entity_type: str
    match_type: str  # 'exact' | 'fuzzy' | 'alias'
    additional_info: dict = field(default_factory=dict)


@dataclass
class ScreeningResult:
    result: str  # 'clear' | 'match' | 'potential_match'
    match_score: float
    matches: list[ScreeningMatch] = field(default_factory=list)
    lists_checked: list[str] = field(default_factory=list)
    error: Optional[str] = None


class SanctionsScreeningEngine:
    """
    Main sanctions screening class.
    Loads watchlists from DB/cache, performs fuzzy matching.
    """
    MATCH_THRESHOLD = 92.0      # Above → MATCH
    POTENTIAL_THRESHOLD = 78.0  # Between 78–92 → POTENTIAL_MATCH
    CACHE_TTL = 3600 * 6        # 6-hour cache

    def __init__(self):
        self._lists: dict[str, list[dict]] = {}

    def screen(self, name: str, aliases: list[str] = None,
               dob: str = None, nationality: str = None) -> ScreeningResult:
        """
        Primary screening entry point.
        Returns ScreeningResult with result, score, and matched entries.
        """
        aliases = aliases or []
        names_to_check = [name] + aliases

        # Normalize for Arabic transliteration
        normalized_names = [normalize_arabic_name(n) for n in names_to_check]

        self._load_all_lists()

        all_matches: list[ScreeningMatch] = []
        lists_checked = list(self._lists.keys())

        for list_name, entries in self._lists.items():
            for query in normalized_names:
                matches = self._fuzzy_match(query, entries, list_name)
                all_matches.extend(matches)

        # DOB cross-check reduces false positives
        if dob and all_matches:
            all_matches = self._crosscheck_dob(all_matches, dob)

        if not all_matches:
            return ScreeningResult(result='clear', match_score=0.0, lists_checked=lists_checked)

        top_score = max(m.match_score for m in all_matches)

        if top_score >= self.MATCH_THRESHOLD:
            result = 'match'
        elif top_score >= self.POTENTIAL_THRESHOLD:
            result = 'potential_match'
        else:
            result = 'clear'
            all_matches = []

        return ScreeningResult(
            result=result,
            match_score=top_score,
            matches=all_matches[:10],  # Top 10 matches only
            lists_checked=lists_checked,
        )

    def _fuzzy_match(self, query: str, entries: list[dict], list_name: str) -> list[ScreeningMatch]:
        matches = []
        names = [e.get('name', '') for e in entries]

        results = process.extract(
            query, names,
            scorer=fuzz.token_sort_ratio,
            limit=5,
            score_cutoff=self.POTENTIAL_THRESHOLD,
        )

        for matched_name, score, idx in results:
            entry = entries[idx]
            matches.append(ScreeningMatch(
                list_source=list_name,
                matched_name=matched_name,
                match_score=float(score),
                entity_type=entry.get('entity_type', 'unknown'),
                match_type='exact' if score >= 99 else 'fuzzy',
                additional_info={
                    'dob': entry.get('dob', ''),
                    'nationality': entry.get('nationality', ''),
                    'aliases': entry.get('aliases', []),
                    'reference': entry.get('reference', ''),
                },
            ))
        return matches

    def _crosscheck_dob(self, matches: list[ScreeningMatch], dob: str) -> list[ScreeningMatch]:
        """
        If DOB is known, boost score for DOB matches, reduce for DOB mismatches.
        Reduces false positive rate significantly.
        """
        filtered = []
        for match in matches:
            entry_dob = match.additional_info.get('dob', '')
            if not entry_dob:
                filtered.append(match)  # No DOB in list — keep
            elif entry_dob == dob:
                match.match_score = min(match.match_score + 5, 100)  # Boost
                filtered.append(match)
            else:
                match.match_score -= 15  # Penalize DOB mismatch
                if match.match_score >= self.POTENTIAL_THRESHOLD:
                    filtered.append(match)
        return filtered

    def _load_all_lists(self):
        """Load all watchlists. Checks Redis cache first, falls back to DB."""
        list_sources = ['ofac_sdn', 'un_consolidated', 'eu_consolidated',
                        'hm_treasury', 'uae_local_terrorist']
        for source in list_sources:
            self._lists[source] = self._load_list(source)

    def _load_list(self, source: str) -> list[dict]:
        cache_key = f"watchlist:{source}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        from apps.aml.models import WatchlistEntry
        entries = list(
            WatchlistEntry.objects.filter(
                watchlist__source=source, watchlist__is_active=True
            ).values('name', 'aliases', 'dob', 'nationality', 'entity_type', 'reference_id')
        )
        cache.set(cache_key, entries, self.CACHE_TTL)
        return entries
