"""
Azure Blob Storage — UAE North region.
KYC documents uploaded per org/customer with content-addressed blob names.
SAS URLs valid for 15 minutes (compliance: documents should not remain publicly accessible).
"""
import uuid
import hashlib
from datetime import datetime, timedelta, timezone

from django.conf import settings


class AzureStorageService:

    def __init__(self):
        from azure.storage.blob import BlobServiceClient
        self._client = BlobServiceClient(
            account_url=f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
            credential=settings.AZURE_STORAGE_ACCOUNT_KEY,
        )
        self._container = settings.AZURE_STORAGE_CONTAINER_NAME

    def upload_kyc_document(
        self,
        file: bytes,
        filename: str,
        content_type: str,
        customer_id: str,
        org_id: str = None,
    ) -> tuple[str, str]:
        """
        Upload a KYC document to Azure Blob Storage.
        Returns (blob_name, blob_url) — URL has no SAS (use generate_sas_url for access).
        """
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'bin'
        unique_id = uuid.uuid4().hex
        blob_name = f"kyc/{customer_id}/{unique_id}.{ext}"

        container_client = self._client.get_container_client(self._container)
        container_client.upload_blob(
            name=blob_name,
            data=file,
            content_settings=self._content_settings(content_type),
            overwrite=False,
        )
        blob_url = f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{self._container}/{blob_name}"
        return blob_name, blob_url

    def generate_sas_url(self, blob_name: str, expiry_minutes: int = 15) -> str:
        """Generate a time-limited SAS URL for a blob."""
        from azure.storage.blob import generate_blob_sas, BlobSasPermissions
        expiry = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)
        sas_token = generate_blob_sas(
            account_name=settings.AZURE_STORAGE_ACCOUNT_NAME,
            container_name=self._container,
            blob_name=blob_name,
            account_key=settings.AZURE_STORAGE_ACCOUNT_KEY,
            permission=BlobSasPermissions(read=True),
            expiry=expiry,
        )
        return (
            f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
            f"/{self._container}/{blob_name}?{sas_token}"
        )

    def delete_blob(self, blob_name: str) -> None:
        """Hard delete — only used for GDPR erasure requests (not normal flow)."""
        self._client.get_blob_client(container=self._container, blob=blob_name).delete_blob()

    @staticmethod
    def _content_settings(content_type: str):
        from azure.storage.blob import ContentSettings
        return ContentSettings(content_type=content_type)
