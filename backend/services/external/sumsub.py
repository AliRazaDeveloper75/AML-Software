"""
Sumsub API client — KYC document verification, face check, liveness.
Set SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY in .env to enable.
Docs: https://developers.sumsub.com
"""
import hashlib
import hmac
import json
import logging
import time

import requests
from django.conf import settings

logger = logging.getLogger('services.sumsub')

BASE_URL = 'https://api.sumsub.com'


def _cfg():
    return {
        'app_token':      getattr(settings, 'SUMSUB_APP_TOKEN', ''),
        'secret_key':     getattr(settings, 'SUMSUB_SECRET_KEY', ''),
        'level_name':     getattr(settings, 'SUMSUB_LEVEL_NAME', 'basic-kyc-level'),
        'webhook_secret': getattr(settings, 'SUMSUB_WEBHOOK_SECRET', ''),
    }


def _is_configured():
    cfg = _cfg()
    return bool(cfg['app_token'] and cfg['secret_key'])


def _signed_headers(method: str, path: str, body: bytes = b'') -> dict:
    cfg = _cfg()
    ts  = str(int(time.time()))
    msg = (ts + method.upper() + path).encode() + body
    sig = hmac.new(cfg['secret_key'].encode(), msg, hashlib.sha256).hexdigest()
    return {
        'X-App-Token':      cfg['app_token'],
        'X-App-Access-Sig': sig,
        'X-App-Access-Ts':  ts,
    }


def _request(method: str, path: str, json_body: dict = None, files=None) -> dict:
    body_bytes = json.dumps(json_body).encode() if json_body else b''
    headers    = _signed_headers(method, path, body_bytes)

    if json_body and not files:
        headers['Content-Type'] = 'application/json'

    resp = requests.request(
        method,
        BASE_URL + path,
        headers=headers,
        json=json_body if not files else None,
        files=files,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json() if resp.content else {}


def create_applicant(external_user_id: str, level_name: str = None) -> dict:
    """
    POST /resources/applicants — create a new Sumsub applicant.
    Returns applicant dict with 'id' field.
    """
    if not _is_configured():
        return {'error': 'Sumsub not configured'}
    lvl = level_name or _cfg()['level_name']
    path = f'/resources/applicants?levelName={lvl}'
    try:
        return _request('POST', path, {'externalUserId': external_user_id})
    except Exception as exc:
        logger.exception('Sumsub create_applicant failed: %s', exc)
        return {'error': str(exc)}


def get_applicant(applicant_id: str) -> dict:
    """GET /resources/applicants/{id} — fetch applicant details."""
    if not _is_configured():
        return {}
    try:
        return _request('GET', f'/resources/applicants/{applicant_id}')
    except Exception as exc:
        logger.exception('Sumsub get_applicant failed: %s', exc)
        return {}


def get_applicant_status(applicant_id: str) -> dict:
    """GET /resources/applicants/{id}/requiredIdDocsStatus — verification status."""
    if not _is_configured():
        return {}
    try:
        return _request('GET', f'/resources/applicants/{applicant_id}/requiredIdDocsStatus')
    except Exception as exc:
        logger.exception('Sumsub get_applicant_status failed: %s', exc)
        return {}


def generate_sdk_link(external_user_id: str, level_name: str = None, ttl_in_secs: int = 3600) -> dict:
    """
    POST /resources/sdkIntegrations/levels/{levelName}/websdkLink
    Returns {'url': 'https://in.sumsub.com/websdk/...', 'token': '...'}.
    """
    if not _is_configured():
        return {'error': 'Sumsub not configured — add SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY to .env'}
    lvl  = level_name or _cfg()['level_name']
    path = f'/resources/sdkIntegrations/levels/{lvl}/websdkLink'
    try:
        result = _request('POST', path, {
            'externalUserId': external_user_id,
            'ttlInSecs': ttl_in_secs,
        })
        token = result.get('token', '')
        return {
            'token': token,
            'url':   f'https://in.sumsub.com/websdk/p/#{token}' if token else '',
        }
    except Exception as exc:
        logger.exception('Sumsub generate_sdk_link failed: %s', exc)
        return {'error': str(exc)}


def create_applicant_and_get_link(customer) -> dict:
    """
    High-level helper: ensure applicant exists in Sumsub, return SDK link.
    Stores sumsub_applicant_id on the customer if newly created.
    """
    if not _is_configured():
        return {'error': 'Sumsub not configured — add SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY to .env'}

    external_id = f'customer_{customer.id}'

    # Use existing applicant ID if stored, else create new
    applicant_id = getattr(customer, 'sumsub_applicant_id', None)
    if not applicant_id:
        resp = create_applicant(external_id)
        if resp.get('error'):
            return resp
        applicant_id = resp.get('id', '')
        if applicant_id and hasattr(customer, 'sumsub_applicant_id'):
            customer.sumsub_applicant_id = applicant_id
            customer.save(update_fields=['sumsub_applicant_id'])

    link = generate_sdk_link(external_id)
    link['applicant_id'] = applicant_id
    return link


def verify_webhook_signature(payload: bytes, header_digest: str) -> bool:
    """
    Verify Sumsub webhook X-Payload-Digest header.
    SUMSUB_WEBHOOK_SECRET must be set.
    """
    secret = _cfg()['webhook_secret']
    if not secret:
        return True  # skip verification in dev if secret not set
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, header_digest or '')
