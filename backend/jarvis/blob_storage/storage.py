import os
from typing import Any, BinaryIO, Generator, Optional, Union
from google.cloud.storage import client, Blob
import datetime
import google.auth
from google.auth.transport import requests
import logging
from abc import abstractmethod

logger = logging.getLogger(__name__)

class Storage:
    @abstractmethod
    def write(self, file_obj: BinaryIO, target: str):
        pass

    @abstractmethod
    def read(self, blob: Union[Blob, str]) -> bytes:
        pass

    @abstractmethod
    def delete(self, blob: Union[Blob, str]):
        pass

    @abstractmethod
    def list(self, prefix: str) -> Generator[Any, Any, None]:
        pass

    @abstractmethod
    def generate_presigned_url(self, blob: Blob) -> str:
        pass

def resolve_storage() -> Storage:
    bucket = os.getenv("DOCUMENT_BUCKET")
    assert bucket, "'DOCUMENT_BUCKET' is not set!"

    if bucket.startswith("gs://"):
        return GCS(bucket_name=bucket.lstrip("gs://"))
    elif bucket.startswith("s3://"):
        raise NotImplementedError
    else:
        raise ValueError("bucket name should either start with 'gs://' or 's3://'")
    

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
        service_account_email = getattr(self.creds, "service_account_email")
        if not service_account_email:
            logger.warning("service account email is empty!")
        
        if isinstance(blob, Blob):
            return self._generate_blob_presigned_url(blob, service_account_email)
        blob_obj = self._get_blob(blob)
        return self._generate_blob_presigned_url(blob_obj, service_account_email)
    
    def _generate_blob_presigned_url(self, blob: Blob, service_account_email: Optional[str]) -> str: 
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=60),
            method="GET",
            service_account_email=service_account_email,
            access_token=self.creds.token,
        )
class S3(Storage):
    pass


# async def cleanup_blob_storage(project_name: str, bucket_name: str, prefix: str):
#     blobs = await must_list(project_name, bucket_name, prefix)
#     storage_client = client.Client(project=project_name)
#     bucket = storage_client.bucket(bucket_name)

#     for b in blobs:
#         blob = bucket.blob(b)
#         blob.delete()


# def generate_download_signed_url_v4(
#     project_name: str, bucket_name: str, blob_name: str
# ) -> str:
#     credentials, project_id = google.auth.default(
#         scopes=[
#             "https://www.googleapis.com/auth/iam",
#             "https://www.googleapis.com/auth/cloud-platform",
#         ]
#     )
#     r = requests.Request()
#     credentials.refresh(r)
#     service_account_email = getattr(credentials, "service_account_email")
#     if not service_account_email:
#         logger.warning("service account email is empty!")
#     storage_client = client.Client(project=project_name)
#     bucket = storage_client.bucket(bucket_name)
#     blob = bucket.blob(blob_name)

#     url = blob.generate_signed_url(
#         version="v4",
#         expiration=datetime.timedelta(minutes=60),
#         method="GET",
#         service_account_email=service_account_email,
#         access_token=credentials.token,
#     )

#     return url
