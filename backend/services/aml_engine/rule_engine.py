"""
Transaction Monitoring Rule Engine.

Rules evaluated on every new transaction:
  R001 — Cash transaction ≥ AED 55,000 (CBUAE reporting threshold)
  R002 — Single transaction ≥ AED 100,000
  R003 — Structuring: ≥ 3 transactions below AED 40,000 within 24 hours from same customer
  R004 — High-risk country counterparty (FATF grey/black list)
  R005 — PEP customer transaction
  R006 — Sanctioned customer transaction
  R007 — Round-amount transaction ≥ AED 50,000 (e.g. exactly 100,000.00)
  R008 — Velocity: ≥ 10 transactions within 1 hour from same customer
  CUSTOM — Tenant-defined rules via MonitoringRule model
"""
import logging
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger('services.rule_engine')

CASH_THRESHOLD = Decimal(str(settings.CBUAE_CASH_REPORTING_THRESHOLD))  # 55,000
STRUCTURING_THRESHOLD = Decimal(str(settings.AML_STRUCTURING_THRESHOLD))  # 40,000
HIGH_VALUE_THRESHOLD = Decimal('100000')
ROUND_AMOUNT_THRESHOLD = Decimal('50000')


class TransactionRuleEngine:

    def __init__(self, transaction):
        self.txn = transaction
        self.org = transaction.organization
        self.triggered = []

    def evaluate(self) -> list[dict]:
        """Run all rules. Returns list of triggered rule dicts."""
        self._rule_r001_cash_threshold()
        self._rule_r002_high_value()
        self._rule_r003_structuring()
        self._rule_r004_high_risk_country()
        self._rule_r005_pep()
        self._rule_r006_sanctioned()
        self._rule_r007_round_amount()
        self._rule_r008_velocity()
        self._evaluate_custom_rules()

        if self.triggered:
            self._create_transaction_alerts()

        return self.triggered

    def _fire(self, rule_code: str, description: str, severity: str = 'high'):
        self.triggered.append({
            'rule_code': rule_code,
            'description': description,
            'severity': severity,
        })
        logger.info('Rule %s fired for transaction %s', rule_code, self.txn.id)

    def _rule_r001_cash_threshold(self):
        if (self.txn.payment_method == 'cash'
                and self.txn.amount_aed >= CASH_THRESHOLD):
            self._fire(
                'R001',
                f'Cash transaction of AED {self.txn.amount_aed:,.2f} exceeds CBUAE reporting threshold of AED {CASH_THRESHOLD:,.0f}.',
                'critical',
            )

    def _rule_r002_high_value(self):
        if self.txn.amount_aed >= HIGH_VALUE_THRESHOLD:
            self._fire(
                'R002',
                f'High-value transaction: AED {self.txn.amount_aed:,.2f} ≥ AED {HIGH_VALUE_THRESHOLD:,.0f}.',
                'high',
            )

    def _rule_r003_structuring(self):
        if not self.txn.customer:
            return
        window_start = self.txn.txn_date - timedelta(hours=24)
        from apps.accounting.models import Transaction
        recent = Transaction.objects.filter(
            organization=self.org,
            customer=self.txn.customer,
            txn_date__gte=window_start,
            txn_date__lte=self.txn.txn_date,
            amount_aed__lt=STRUCTURING_THRESHOLD,
        ).exclude(pk=self.txn.pk).count()

        if recent >= 2:  # this txn + 2 prior = 3 total
            self._fire(
                'R003',
                f'Potential structuring: {recent + 1} transactions below AED {STRUCTURING_THRESHOLD:,.0f} within 24 hours.',
                'critical',
            )

    def _rule_r004_high_risk_country(self):
        from core.utils import fatf_grey_list, fatf_black_list
        country = self.txn.counterparty_country.upper() if self.txn.counterparty_country else ''
        if country in fatf_black_list():
            self._fire(
                'R004',
                f'Counterparty country {country} is on the FATF blacklist.',
                'critical',
            )
        elif country in fatf_grey_list():
            self._fire(
                'R004',
                f'Counterparty country {country} is on the FATF greylist.',
                'high',
            )

    def _rule_r005_pep(self):
        if self.txn.customer and self.txn.customer.is_pep:
            self._fire(
                'R005',
                f'Transaction involves a Politically Exposed Person (PEP): {self.txn.customer}.',
                'high',
            )

    def _rule_r006_sanctioned(self):
        if self.txn.customer and self.txn.customer.is_sanctioned:
            self._fire(
                'R006',
                f'Transaction involves a sanctioned customer: {self.txn.customer}.',
                'critical',
            )

    def _rule_r007_round_amount(self):
        if self.txn.amount_aed >= ROUND_AMOUNT_THRESHOLD:
            cents = self.txn.amount_aed % Decimal('1000')
            if cents == Decimal('0'):
                self._fire(
                    'R007',
                    f'Round-amount transaction: AED {self.txn.amount_aed:,.2f} — potential indicator of structuring or test payments.',
                    'medium',
                )

    def _rule_r008_velocity(self):
        if not self.txn.customer:
            return
        window_start = self.txn.txn_date - timedelta(hours=1)
        from apps.accounting.models import Transaction
        count = Transaction.objects.filter(
            organization=self.org,
            customer=self.txn.customer,
            txn_date__gte=window_start,
            txn_date__lte=self.txn.txn_date,
        ).exclude(pk=self.txn.pk).count()

        if count >= 9:  # 10 total with this one
            self._fire(
                'R008',
                f'High-velocity: {count + 1} transactions from the same customer within 1 hour.',
                'high',
            )

    def _evaluate_custom_rules(self):
        """Evaluate org-specific MonitoringRule records."""
        from apps.monitoring.models import MonitoringRule
        custom_rules = MonitoringRule.objects.filter(organization=self.org, is_active=True)

        for rule in custom_rules:
            try:
                if self._evaluate_custom_rule(rule):
                    self._fire(
                        rule.rule_code,
                        f'Custom rule triggered: {rule.name}',
                        rule.severity,
                    )
            except Exception as exc:
                logger.warning('Custom rule %s evaluation error: %s', rule.rule_code, exc)

    def _evaluate_custom_rule(self, rule) -> bool:
        """Simple threshold-based custom rule evaluation."""
        threshold = rule.threshold_amount
        if threshold and self.txn.amount_aed >= threshold:
            return True
        return False

    def _create_transaction_alerts(self):
        """Create TransactionAlert records for each triggered rule."""
        from apps.monitoring.models import MonitoringRule, TransactionAlert
        for fired in self.triggered:
            rule = MonitoringRule.objects.filter(
                organization=self.org,
                rule_code=fired['rule_code'],
            ).first()
            if rule:
                TransactionAlert.objects.create(
                    organization=self.org,
                    transaction=self.txn,
                    rule=rule,
                    customer=self.txn.customer,
                    alert_data={
                        'description': fired['description'],
                        'amount_aed': str(self.txn.amount_aed),
                        'txn_date': self.txn.txn_date.isoformat(),
                    },
                )
