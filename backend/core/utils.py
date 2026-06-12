import re
import uuid
import hashlib
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings


def format_aed(amount: Decimal) -> str:
    """Format amount as AED with 2 decimal places."""
    return f"AED {amount:,.2f}"


def round_aed(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_vat(amount: Decimal, rate: Decimal = None) -> dict:
    rate = rate or Decimal(str(settings.UAE_VAT_RATE))
    vat = round_aed(amount * rate)
    return {'subtotal': amount, 'vat_amount': vat, 'total': amount + vat, 'rate': rate}


def validate_emirates_id(eid: str) -> bool:
    """Validate UAE Emirates ID format: 784-YYYY-XXXXXXX-X"""
    pattern = r'^784-\d{4}-\d{7}-\d$'
    return bool(re.match(pattern, eid))


def validate_trn(trn: str) -> bool:
    """Validate UAE TRN (Tax Registration Number): 15 digits."""
    return bool(re.match(r'^\d{15}$', trn.replace('-', '')))


def validate_trade_license(license_no: str) -> bool:
    """Basic trade license format check."""
    return bool(re.match(r'^[A-Z0-9\-/]{5,20}$', license_no.upper()))


def generate_invoice_number(org_prefix: str, sequence: int) -> str:
    return f"INV-{org_prefix.upper()[:4]}-{sequence:06d}"


def generate_reference() -> str:
    return str(uuid.uuid4()).replace('-', '').upper()[:12]


def hash_sensitive(value: str) -> str:
    """One-way hash for storing sensitive lookups (e.g. API keys)."""
    return hashlib.sha256(value.encode()).hexdigest()


def mask_emirates_id(eid: str) -> str:
    """Returns 784-****-*****-X for display."""
    if not eid or len(eid) < 4:
        return '***'
    return f"784-****-*****-{eid[-1]}"


def mask_account_number(account: str) -> str:
    return f"****{account[-4:]}" if len(account) >= 4 else '****'


def get_quarter(date) -> tuple:
    """Returns (quarter_number, year) for a given date."""
    q = (date.month - 1) // 3 + 1
    return q, date.year


def fatf_grey_list() -> list:
    """Returns current FATF grey-list country codes (updated periodically)."""
    return [
        'BJ', 'BF', 'CM', 'CD', 'HT', 'IR', 'JM', 'ML', 'MZ',
        'NG', 'PH', 'SA', 'SN', 'SS', 'SY', 'TZ', 'TR', 'UG',
        'VU', 'VN', 'YE', 'ZW',
    ]


def fatf_black_list() -> list:
    """Countries subject to FATF call for action."""
    return ['KP', 'IR', 'MM']


def normalize_arabic_name(name: str) -> str:
    """
    Normalize Arabic/Islamic names for fuzzy matching.
    Handles common transliteration variants.
    """
    replacements = {
        'mohammed': 'muhammad', 'mohamed': 'muhammad', 'mohd': 'muhammad',
        'abdulla': 'abdullah', 'abd allah': 'abdullah',
        'al ': '', 'al-': '', 'bin ': '', 'bint ': '',
        'ibn ': '', 'bt ': '',
    }
    name = name.lower().strip()
    for k, v in replacements.items():
        name = name.replace(k, v)
    return ' '.join(name.split())
