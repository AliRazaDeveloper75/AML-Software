import uuid
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Abstract base: uuid pk + created/updated timestamps."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantScopedModel(TimeStampedModel):
    """Abstract base for all multi-tenant data. Every subclass is isolated by org."""
    organization = models.ForeignKey(
        'tenants.Organization',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        db_index=True,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Guard: organization must be set before saving
        if not self.organization_id:
            raise ValueError(f"{self.__class__.__name__} requires an organization.")
        super().save(*args, **kwargs)


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    """Mixin for soft-delete (never physically remove compliance records)."""
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def hard_delete(self):
        super().delete()

    @property
    def is_deleted(self):
        return self.deleted_at is not None
