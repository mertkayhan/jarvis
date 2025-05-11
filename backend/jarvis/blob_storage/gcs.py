from jarvis.blob_storage.storage import Storage
from google.auth.transport import requests
import datetime
import google.auth
from google.cloud.storage import client, Blob
from typing import Any, BinaryIO, Generator, Optional, Union
import logging

logger = logging.getLogger(__name__)


class GCS(Storage):
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        credentials, project_id = google.auth.default(
            scopes=[
                "https://www.googleapis.com/auth/iam",
                "https://www.googleapis.com/auth/cloud-platform",
            ]
        )
        self.creds = credentials
        self.project_id = project_id
        self.client = client.Client(project=project_id)

    def list(self, prefix: str) -> Generator[Any, Any, None]:
        # give time for changes to propagate
        blobs = self.client.list_blobs(bucket_or_name=self.bucket_name, prefix=prefix)
        yield from blobs

    def delete(self, blob: Union[Blob, str]):
        if isinstance(blob, Blob):
            return blob.delete()
        blob_obj = self._get_blob(blob)
        return blob_obj.delete()

    def write(self, file_obj: BinaryIO, target: str):
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(target)
        file_obj.seek(0)
        blob.upload_from_file(file_obj)

    def read(self, blob: Union[Blob, str]) -> bytes:
        if isinstance(blob, Blob):
            return self._read_blob(blob)
        blob_obj = self._get_blob(blob)
        return self._read_blob(blob_obj)

    def _get_blob(self, blob_name: str) -> Blob:
        bucket = self.client.bucket(self.bucket_name)
        blob_obj = bucket.blob(blob_name)
        return blob_obj

    def _read_blob(self, blob: Blob) -> bytes:
        with blob.open(mode="rb") as f:
            data = f.read()
            return data  # type: ignore

    def generate_presigned_url(self, blob: Union[Blob, str]) -> str:
        r = requests.Request()
        self.creds.refresh(r)
        service_account_email = getattr(self.creds, "service_account_email", None)
        if not service_account_email:
            logger.warning("service account email is empty!")

        if isinstance(blob, Blob):
            return self._generate_blob_presigned_url(blob, service_account_email)
        blob_obj = self._get_blob(blob)
        return self._generate_blob_presigned_url(blob_obj, service_account_email)

    def _generate_blob_presigned_url(
        self, blob: Blob, service_account_email: Optional[str]
    ) -> str:
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=60),
            method="GET",
            service_account_email=service_account_email,
            access_token=self.creds.token,
        )
