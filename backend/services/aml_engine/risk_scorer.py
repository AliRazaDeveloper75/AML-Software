"""
Risk Scoring Engine for UAE AML Compliance.

Implements CBUAE AML/CFT Risk-Based Approach (RBA) scoring.
Scores run 0–100 and map to Low/Medium/High/Critical risk levels.
"""
from __future__ import annotations
from decimal import Decimal
from core.utils import fatf_grey_list, fatf_black_list


HIGH_RISK_INDUSTRIES = {
    'cryptocurrency', 'crypto', 'virtual assets', 'money exchange',
    'hawala', 'cash-intensive', 'casino', 'gambling', 'arms', 'weapons',
    'real estate', 'precious metals', 'jewelry', 'antiques', 'art dealer',
}

HIGH_RISK_COUNTRIES = set(fatf_grey_list())
CRITICAL_RISK_COUNTRIES = set(fatf_black_list())


class RiskScorer:
    """
    Calculates a composite risk score for a Customer based on:
    - Nationality/country of incorporation
    - PEP status
    - Industry/business activity
    - Sanctions/watchlist status
    - Adverse media
    - Product/service exposure
    - Transaction patterns (if available)
    """

    def __init__(self, customer):
        self.customer = customer
        self._factors: list[dict] = []
        self._total = 0

    def calculate(self) -> tuple[int, str]:
        """Returns (score 0–100, risk_level string)."""
        self._total = 0
        self._factors = []

        self._score_nationality()
        self._score_pep()
        self._score_industry()
        self._score_sanctions()
        self._score_document_completeness()
        self._score_source_of_funds()
        self._score_expected_turnover()

        score = min(self._total, 100)
        level = self._level(score)
        return score, level

    def get_factors(self) -> list[dict]:
        """Returns the list of scored factors for audit/display."""
        return self._factors

    def _add(self, factor: str, points: int, reason: str = ''):
        self._total += points
        self._factors.append({'factor': factor, 'points': points, 'reason': reason})

    def _score_nationality(self):
        c = self.customer
        nat = (c.nationality or c.incorporation_country or '').upper()
        if nat in CRITICAL_RISK_COUNTRIES:
            self._add('nationality', 50, f"Country {nat} is on FATF black list (call for action).")
        elif nat in HIGH_RISK_COUNTRIES:
            self._add('nationality', 30, f"Country {nat} is on FATF grey list (enhanced monitoring).")
        elif nat == 'AE':
            self._add('nationality', 0, 'UAE national — standard risk.')
        else:
            self._add('nationality', 5, 'Foreign national — standard enhanced check.')

    def _score_pep(self):
        if self.customer.is_pep:
            self._add('pep_status', 40, 'Customer is a Politically Exposed Person (PEP). EDD required.')
        elif self.customer.customer_type == 'corporate':
            # Check UBOs for PEP
            pep_ubos = self.customer.ubos.filter(is_pep=True).count()
            if pep_ubos > 0:
                self._add('ubo_pep', 30, f"{pep_ubos} UBO(s) identified as PEPs.")

    def _score_industry(self):
        industry = (self.customer.industry or self.customer.business_activity or '').lower()
        for high_risk_sector in HIGH_RISK_INDUSTRIES:
            if high_risk_sector in industry:
                self._add('industry', 20, f"High-risk industry: {high_risk_sector}.")
                break

    def _score_sanctions(self):
        if self.customer.is_sanctioned:
            self._add('sanctions', 50, 'Customer matched on sanctions list. IMMEDIATE action required.')

    def _score_document_completeness(self):
        c = self.customer
        if c.customer_type == 'individual':
            if not c.emirates_id and not c.passport_number:
                self._add('documents', 15, 'No identity documents provided.')
            elif not c.documents.filter(status='verified').exists():
                self._add('documents', 10, 'Documents not yet verified.')
        else:
            if not c.trade_license_no:
                self._add('documents', 15, 'No trade license number provided.')
            if c.ubos.count() == 0:
                self._add('documents', 10, 'No UBO declaration submitted.')

    def _score_source_of_funds(self):
        if not self.customer.source_of_funds:
            self._add('source_of_funds', 10, 'Source of funds not declared.')

    def _score_expected_turnover(self):
        c = self.customer
        if c.expected_annual_turnover and c.expected_annual_turnover > Decimal('10000000'):
            self._add('turnover', 10, 'Expected annual turnover > AED 10M — higher monitoring required.')

    @staticmethod
    def _level(score: int) -> str:
        if score >= 80:
            return 'critical'
        if score >= 60:
            return 'high'
        if score >= 30:
            return 'medium'
        return 'low'
