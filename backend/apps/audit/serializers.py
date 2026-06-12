from rest_framework import serializers
from .models import AuditLog, EntityChangeLog


class EntityChangeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityChangeLog
        fields = ['id', 'field_name', 'old_value', 'new_value']
        read_only_fields = fields


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default=None)
    user_name = serializers.CharField(source='user.full_name', read_only=True, default=None)
    changes = EntityChangeLogSerializer(many=True, read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'action', 'path', 'status_code',
            'ip_address', 'user_agent', 'duration_ms', 'request_id',
            'entity_type', 'entity_id', 'old_value', 'new_value',
            'notes', 'changes', 'created_at',
        ]
        read_only_fields = fields


class AuditLogListSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'path',
            'status_code', 'entity_type', 'entity_id',
            'ip_address', 'duration_ms', 'created_at',
        ]
        read_only_fields = fields
