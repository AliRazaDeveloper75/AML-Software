"""
ComplyAdvantage API client — PEP, sanctions, watchlist, adverse media.
Set COMPLYADVANTAGE_API_KEY in .env to enable real screening.
Falls back silently so existing local engine still runs when key is absent.
Docs: https://docs.complyadvantage.com
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger('services.complyadvantage')

BASE_URL = 'https://api.complyadvantage.com'


def _key():
    return getattr(settings, 'COMPLYADVANTAGE_API_KEY', '')


def _headers():
    return {'Authorization': f'Token {_key()}', 'Content-Type': 'application/json'}


def search(
    name: str,
    entity_type: str = 'person',   # 'person' | 'company'
    dob: str = None,
    nationality: str = None,
    fuzziness: float = 0.6,
) -> dict:
    """
    POST /searches — search for PEP, sanctions, adverse media matches.

    Returns parsed dict:
    {
        'search_id': str,
        'total_hits': int,
        'is_pep': bool,
        'is_sanctioned': bool,
        'adverse_media': bool,
        'hits': [{'name', 'score', 'types', 'match_types'}],
    }
    Returns {} when API key not set.
    """
    if not _key():
        return {}

    payload = {
        'search_term': name,
        'fuzziness': fuzziness,
        'search_profile': 'sanctions_pep_media',
        'entity_type': entity_type,
        'filters': {
            'types': ['sanction', 'pep', 'adverse-media', 'warning'],
        },
    }
    if dob:
        payload['filters']['birth_year'] = str(dob)[:4]
    if nationality:
        payload['filters']['nationality'] = nationality

    try:
        resp = requests.post(
            f'{BASE_URL}/searches',
            json=payload,
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.exception('ComplyAdvantage search error: %s', exc)
        return {}

    hits_raw = data.get('content', {}).get('data', {}).get('hits', [])
    search_id = data.get('content', {}).get('data', {}).get('id', '')

    hits = []
    is_pep = is_sanctioned = adverse_media = False

    for hit in hits_raw:
        doc = hit.get('doc', {})
        fields = {f['name']: f.get('value', '') for f in doc.get('fields', [])}
        types = fields.get('types', '').split(',') if fields.get('types') else []

        if 'sanction' in types:
            is_sanctioned = True
        if any(t.startswith('pep') for t in types):
            is_pep = True
        if 'adverse-media' in types:
            adverse_media = True

        hits.append({
            'name':        doc.get('name', ''),
            'score':       hit.get('score', 0),
            'types':       types,
            'match_types': hit.get('match_types', []),
            'entity_id':   doc.get('id', ''),
        })

    return {
        'search_id':    search_id,
        'total_hits':   len(hits),
        'is_pep':       is_pep,
        'is_sanctioned': is_sanctioned,
        'adverse_media': adverse_media,
        'hits':         hits,
    }


def get_search(search_id: str) -> dict:
    """GET /searches/{id} — fetch a previous search result."""
    if not _key() or not search_id:
        return {}
    try:
        resp = requests.get(f'{BASE_URL}/searches/{search_id}', headers=_headers(), timeout=15)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        logger.exception('ComplyAdvantage get_search error: %s', exc)
        return {}
