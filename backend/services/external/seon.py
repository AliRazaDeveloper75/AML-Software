"""
SEON Fraud Detection API — email, phone, IP risk scoring, device fingerprinting.
Set SEON_API_KEY in .env to enable.
Docs: https://docs.seon.io
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger('services.seon')

BASE_URL = 'https://api.seon.io/SeonRestService'


def _key():
    return getattr(settings, 'SEON_API_KEY', '')


def _headers():
    return {
        'X-API-KEY': _key(),
        'Content-Type': 'application/json',
    }


def fraud_score(
    email: str = None,
    phone: str = None,
    ip: str = None,
    full_name: str = None,
    session: str = None,
) -> dict:
    """
    POST /fraud-api/v2/ — comprehensive fraud score.

    Returns parsed dict:
    {
        'score': float (0-100),
        'state': 'approve' | 'review' | 'decline',
        'email_risk': float,
        'phone_risk': float,
        'ip_risk': float,
        'flags': [str],
        'raw': dict,
    }
    Returns {} when API key not set.
    """
    if not _key():
        return {}

    payload = {'config': {'include_invalid': True}}
    if email:
        payload['email'] = email
    if phone:
        payload['phone_number'] = phone
    if ip:
        payload['ip'] = ip
    if full_name:
        payload['full_name'] = full_name
    if session:
        payload['session_id'] = session

    try:
        resp = requests.post(
            f'{BASE_URL}/fraud-api/v2/',
            json=payload,
            headers=_headers(),
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.exception('SEON fraud_score error: %s', exc)
        return {}

    result = data.get('data', {})
    flags  = [r.get('id', '') for r in result.get('applied_rules', []) if r.get('triggered')]

    return {
        'score':      result.get('fraud_score', 0),
        'state':      result.get('state', 'review'),
        'email_risk': result.get('email', {}).get('score', 0) if email else None,
        'phone_risk': result.get('phone', {}).get('score', 0) if phone else None,
        'ip_risk':    result.get('ip', {}).get('score', 0) if ip else None,
        'flags':      flags,
        'raw':        result,
    }


def email_check(email: str) -> dict:
    """
    GET /email-api/v2/{email} — lightweight email risk check.
    """
    if not _key() or not email:
        return {}
    try:
        resp = requests.get(
            f'{BASE_URL}/email-api/v2/{email}',
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.exception('SEON email_check error: %s', exc)
        return {}

    result = data.get('data', {})
    return {
        'score':        result.get('score', 0),
        'domain_valid': result.get('domain_details', {}).get('valid', True),
        'disposable':   result.get('email_details', {}).get('disposable', False),
        'deliverable':  result.get('email_details', {}).get('deliverable', True),
        'free_provider': result.get('domain_details', {}).get('free', False),
    }
