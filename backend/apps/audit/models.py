from django.db import models


class AuditLog(models.Model):
    """
    Immutable audit trail for CBUAE AML compliance.
    5-year retention required.
    Never updated or deleted via application code.
    """
    organization = models.ForeignKey(
        'tenants.Organization', on_delete=models.SET_NULL, null=True, db_index=True
    )
    user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=10)  # HTTP method
    path = models.CharField(max_length=500)
    status_code = models.PositiveSmallIntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    request_id = models.CharField(max_length=36, blank=True, db_index=True)

    # Entity-level tracking (optional, set by specific views)
    entity_type = models.CharField(max_length=50, blank=True)
    entity_id = models.CharField(max_length=36, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        # Postgres RLS should be added via migration for true immutability

    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionError('AuditLog records are immutable.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('AuditLog records cannot be deleted.')


class EntityChangeLog(models.Model):
    """
    Detailed field-level change tracking for sensitive entities
    (Customer KYC, AML alerts, user roles).
    """
    audit_log = models.ForeignKey(AuditLog, on_delete=models.CASCADE, related_name='changes')
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    class Meta:
        db_table = 'entity_change_logs'
