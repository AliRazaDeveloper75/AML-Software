"""
AML Celery tasks:
- screen_customer: full AML screening on demand
- evaluate_transaction_rules: run monitoring rules on a new transaction
- refresh_ofac_watchlist / refresh_un_watchlist: daily OFAC/UN list updates
- reschedule_periodic_screening: monthly re-screening of high-risk customers
"""
import logging
from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger('tasks.aml')


@shared_task(bind=True, max_retries=3, default_retry_delay=60, name='tasks.aml_tasks.screen_customer')
def screen_customer(self, customer_id: str, triggered_by_user_id: str = None):
    """
    Run a full AML screening on a customer:
    1. Sanctions screening (OFAC, UN, EU, HM, UAE)
    2. PEP check
    3. Adverse media
    4. Re-score risk
    5. Create AMLScreening record and raise AMLAlert if needed
    """
    try:
        from apps.kyc.models import Customer
        from apps.aml.models import AMLScreening, AMLAlert
        from services.aml_engine.sanctions import SanctionsScreeningEngine
        from services.aml_engine.risk_scorer import RiskScorer
        from services.external.complyadvantage import search as ca_search
        from services.external.seon import fraud_score as seon_score

        customer = Customer.objects.select_related('organization').get(pk=customer_id)
        org = customer.organization

        if customer.customer_type == 'individual':
            names = [f"{customer.first_name} {customer.last_name}"]
            entity_type = 'person'
        else:
            names = [customer.company_name]
            entity_type = 'company'

        # ── Step 1: ComplyAdvantage (real API) ─────────────────────────────────
        ca_result = ca_search(
            name=names[0],
            entity_type=entity_type,
            dob=str(customer.date_of_birth) if customer.date_of_birth else None,
            nationality=customer.nationality,
        )

        if ca_result:
            # Use ComplyAdvantage results
            is_sanctioned  = ca_result['is_sanctioned']
            is_pep         = ca_result['is_pep']
            adverse_media  = ca_result['adverse_media']
            total_hits     = ca_result['total_hits']
            best_score     = max((h['score'] for h in ca_result['hits']), default=0)
            matched_entries = ca_result['hits']
            raw_results    = ca_result

            if is_sanctioned:
                screening_status = 'match'
                customer.is_sanctioned = True
                customer.kyc_status = 'suspended'
            elif total_hits > 0:
                screening_status = 'potential_match'
            else:
                screening_status = 'clear'

            # Push CA flags onto customer
            customer.is_pep      = is_pep
            customer.adverse_media = adverse_media
            logger.info('ComplyAdvantage screening for %s: %s hits, sanctioned=%s, pep=%s',
                        names[0], total_hits, is_sanctioned, is_pep)
        else:
            # ── Fallback: local sanctions engine ─────────────────────────────
            logger.info('ComplyAdvantage not configured — using local engine')
            engine = SanctionsScreeningEngine()
            result = engine.screen(
                name=names[0],
                aliases=names[1:],
                dob=customer.date_of_birth,
                nationality=customer.nationality,
            )

            if result.status == 'match':
                screening_status = 'match'
                customer.is_sanctioned = True
                customer.kyc_status = 'suspended'
            elif result.status == 'potential_match':
                screening_status = 'potential_match'
            else:
                screening_status = 'clear'

            best_score      = result.best_score or 0
            matched_entries = result.matches
            raw_results     = result.raw

        # ── Step 2: SEON fraud check ───────────────────────────────────────────
        seon_result = seon_score(
            email=customer.email,
            phone=str(customer.phone) if customer.phone else None,
            full_name=names[0],
        )
        if seon_result:
            fraud_sc = seon_result.get('score', 0)
            logger.info('SEON fraud score for %s: %.1f (%s)', names[0], fraud_sc, seon_result.get('state'))
            # Elevate screening status if SEON flags high fraud risk
            if fraud_sc >= 75 and screening_status == 'clear':
                screening_status = 'potential_match'
                if AMLAlert is not None:
                    AMLAlert.objects.get_or_create(
                        organization=org,
                        customer=customer,
                        alert_type='fraud_risk',
                        defaults={
                            'severity': 'high',
                            'title': f'High Fraud Risk: {names[0]}',
                            'description': f'SEON fraud score {fraud_sc:.0f}/100. Flags: {", ".join(seon_result.get("flags", []))}',
                            'status': 'open',
                        },
                    )

        screened_by = None
        if triggered_by_user_id:
            from apps.users.models import User
            try:
                screened_by = User.objects.get(pk=triggered_by_user_id)
            except User.DoesNotExist:
                pass

        from django.utils import timezone
        screening = AMLScreening.objects.create(
            organization=org,
            customer=customer,
            screening_type='full',
            status=screening_status,
            match_score=best_score,
            matched_entries=matched_entries,
            raw_results=raw_results,
            screened_by=screened_by,
            screened_at=timezone.now(),
        )

        # ── Step 3: Re-score risk ──────────────────────────────────────────────
        scorer = RiskScorer(customer)
        risk_data = scorer.calculate()
        customer.risk_score   = risk_data['score']
        customer.risk_level   = risk_data['level']
        customer.is_pep       = risk_data.get('is_pep', customer.is_pep)
        customer.requires_edd = risk_data.get('requires_edd', False)
        customer.last_screened_at = timezone.now()
        customer.save()

        # ── Step 4: Raise AML alert if needed ─────────────────────────────────
        if screening_status in ('match', 'potential_match'):
            severity = 'critical' if screening_status == 'match' else 'high'
            AMLAlert.objects.create(
                organization=org,
                customer=customer,
                screening=screening,
                alert_type='sanctions_match',
                severity=severity,
                title=f'Sanctions {screening_status.replace("_", " ").title()}: {names[0]}',
                description=(
                    f'ComplyAdvantage: {ca_result.get("total_hits", 0)} hits. '
                    if ca_result else f'Score: {best_score:.1f}. '
                ) + f'{len(matched_entries) if isinstance(matched_entries, list) else 0} watchlist entries.',
                status='open',
            )
            _notify_compliance(org.id, {
                'type': 'aml_alert',
                'customer_id': customer_id,
                'severity': severity,
                'message': f'Sanctions alert for {names[0]}',
            })

        cache.delete(f'aml_screen_lock_{customer_id}')
        logger.info('Screening complete for customer %s: %s', customer_id, screening_status)
        return {'status': screening_status, 'screening_id': str(screening.id)}

    except Exception as exc:
        logger.exception('Screening failed for customer %s: %s', customer_id, exc)
        cache.delete(f'aml_screen_lock_{customer_id}')
        raise self.retry(exc=exc)


@shared_task(name='tasks.aml_tasks.evaluate_transaction_rules')
def evaluate_transaction_rules(transaction_id: str):
    """
    Evaluate all active monitoring rules for a transaction.
    Creates TransactionAlert records and flags the transaction if rules fire.
    """
    try:
        from apps.accounting.models import Transaction
        from services.aml_engine.rule_engine import TransactionRuleEngine

        txn = Transaction.objects.select_related('organization', 'customer').get(pk=transaction_id)
        engine = TransactionRuleEngine(txn)
        triggered = engine.evaluate()

        if triggered:
            rules_fired = [r['rule_code'] for r in triggered]
            txn.is_flagged = True
            txn.rules_triggered = rules_fired
            txn.flag_reason = '; '.join(r['description'] for r in triggered)
            txn.save(update_fields=['is_flagged', 'rules_triggered', 'flag_reason'])
            logger.info('Transaction %s flagged by rules: %s', transaction_id, rules_fired)

    except Exception as exc:
        logger.exception('Rule evaluation failed for transaction %s: %s', transaction_id, exc)


@shared_task(name='tasks.aml_tasks.refresh_ofac_watchlist')
def refresh_ofac_watchlist():
    """
    Download and sync OFAC SDN list.
    Called daily at 2 AM UTC by celery-beat.
    """
    logger.info('Starting OFAC watchlist refresh')
    try:
        import httpx
        from django.conf import settings
        from apps.aml.models import Watchlist, WatchlistEntry

        watchlist, _ = Watchlist.objects.get_or_create(
            source='ofac',
            defaults={'name': 'OFAC SDN List', 'description': 'US Office of Foreign Assets Control'}
        )

        # OFAC publishes a JSON endpoint
        url = 'https://data.trade.gov/consolidated_screening_list/v1/search'
        headers = {'Authorization': f'Bearer {settings.OFAC_API_KEY}'} if settings.OFAC_API_KEY else {}

        with httpx.Client(timeout=30) as client:
            resp = client.get(url, headers=headers, params={'sources': 'SDN', 'size': 10000})
            resp.raise_for_status()
            data = resp.json()

        entries_data = data.get('results', [])
        synced = 0
        for item in entries_data:
            name = item.get('name', '')
            if not name:
                continue
            aliases = [a.get('whole_name', '') for a in item.get('alt_names', []) if a.get('whole_name')]
            WatchlistEntry.objects.update_or_create(
                watchlist=watchlist,
                source_reference=item.get('id', ''),
                defaults={
                    'entry_type': 'entity' if item.get('type') == 'Entity' else 'individual',
                    'full_name': name,
                    'aliases': aliases,
                    'nationality': item.get('country', ''),
                    'programs': item.get('programs', []),
                    'reason': item.get('remarks', ''),
                    'is_active': True,
                }
            )
            synced += 1

        from django.utils import timezone
        watchlist.last_updated = timezone.now()
        watchlist.save(update_fields=['last_updated'])

        # Invalidate cache
        cache.delete_pattern('sanctions_watchlist_*')
        logger.info('OFAC refresh complete: %d entries synced', synced)
        return {'synced': synced}

    except Exception as exc:
        logger.exception('OFAC refresh failed: %s', exc)
        raise


@shared_task(name='tasks.aml_tasks.refresh_un_watchlist')
def refresh_un_watchlist():
    """
    Download and sync UN Security Council consolidated sanctions list.
    Called weekly (Sundays 3 AM UTC).
    """
    logger.info('Starting UN watchlist refresh')
    try:
        import httpx
        from apps.aml.models import Watchlist, WatchlistEntry

        watchlist, _ = Watchlist.objects.get_or_create(
            source='un',
            defaults={'name': 'UN Security Council List', 'description': 'United Nations consolidated sanctions list'}
        )

        # UN XML endpoint — parse simplified version
        url = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml'
        with httpx.Client(timeout=60) as client:
            resp = client.get(url)
            resp.raise_for_status()

        import xml.etree.ElementTree as ET
        root = ET.fromstring(resp.content)
        ns = {'un': 'https://scsanctions.un.org/resources/xml/en/consolidated.xml'}

        synced = 0
        for individual in root.findall('.//INDIVIDUAL'):
            first = individual.findtext('FIRST_NAME', '') or ''
            second = individual.findtext('SECOND_NAME', '') or ''
            third = individual.findtext('THIRD_NAME', '') or ''
            fourth = individual.findtext('FOURTH_NAME', '') or ''
            full_name = ' '.join(filter(None, [first, second, third, fourth]))
            ref = individual.findtext('REFERENCE_NUMBER', '')
            if not full_name:
                continue

            WatchlistEntry.objects.update_or_create(
                watchlist=watchlist,
                source_reference=ref,
                defaults={
                    'entry_type': 'individual',
                    'full_name': full_name,
                    'nationality': individual.findtext('NATIONALITY/VALUE', '') or '',
                    'is_active': True,
                }
            )
            synced += 1

        from django.utils import timezone
        watchlist.last_updated = timezone.now()
        watchlist.save(update_fields=['last_updated'])
        cache.delete_pattern('sanctions_watchlist_*')
        logger.info('UN refresh complete: %d entries', synced)
        return {'synced': synced}

    except Exception as exc:
        logger.exception('UN refresh failed: %s', exc)
        raise


@shared_task(name='tasks.aml_tasks.reschedule_periodic_screening')
def reschedule_periodic_screening():
    """
    Monthly: queue re-screening for all high-risk and critical customers.
    """
    from apps.kyc.models import Customer
    customers = Customer.objects.filter(
        risk_level__in=['high', 'critical'],
        kyc_status='verified',
        deleted_at__isnull=True,
    ).values_list('id', flat=True)

    count = 0
    for cid in customers:
        screen_customer.delay(str(cid))
        count += 1
    logger.info('Queued periodic re-screening for %d high-risk customers', count)
    return {'queued': count}


def _notify_compliance(org_id, message: dict):
    """Push a real-time message to the organization's compliance WebSocket group."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        layer = get_channel_layer()
        group_name = f'compliance_{org_id}'
        async_to_sync(layer.group_send)(group_name, {**message, 'type': 'compliance.message'})
    except Exception as exc:
        logger.warning('WebSocket notification failed: %s', exc)
