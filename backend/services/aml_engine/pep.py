"""
PEP (Politically Exposed Person) screening.
Uses the organization's PEP database + fuzzy name matching.
PEP data sourced from open datasets and optionally commercial APIs.
"""
import logging
from rapidfuzz import process, fuzz

logger = logging.getLogger('services.pep_engine')

MATCH_THRESHOLD = 90.0


class PEPScreeningEngine:

    def screen(self, name: str, nationality: str = None) -> dict:
        """
        Screen a name against the PEP database.
        Returns {'is_pep': bool, 'match_score': float, 'matched_entry': dict|None}
        """
        try:
            from apps.aml.models import WatchlistEntry
            pep_entries = WatchlistEntry.objects.filter(
                watchlist__source='pep',
                watchlist__is_active=True,
                is_active=True,
            ).values_list('full_name', 'id', 'nationality', 'reason')

            names = [e[0] for e in pep_entries]
            if not names:
                return {'is_pep': False, 'match_score': 0.0, 'matched_entry': None}

            results = process.extract(name, names, scorer=fuzz.token_sort_ratio, limit=5)
            if not results:
                return {'is_pep': False, 'match_score': 0.0, 'matched_entry': None}

            best_match, best_score, best_idx = results[0]
            if best_score >= MATCH_THRESHOLD:
                matched = pep_entries[best_idx]
                # Nationality cross-check
                if nationality and matched[2] and nationality.upper() != matched[2].upper():
                    best_score = max(best_score - 15, 0)

                if best_score >= MATCH_THRESHOLD:
                    return {
                        'is_pep': True,
                        'match_score': best_score,
                        'matched_entry': {
                            'id': str(matched[1]),
                            'name': matched[0],
                            'role': matched[3],
                        },
                    }

            return {'is_pep': False, 'match_score': best_score, 'matched_entry': None}

        except Exception as exc:
            logger.exception('PEP screening error for %s: %s', name, exc)
            return {'is_pep': False, 'match_score': 0.0, 'matched_entry': None, 'error': str(exc)}
