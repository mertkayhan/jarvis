import asyncio
from typing import List
from google.cloud.storage import client
import datetime
import google.auth
from google.auth.transport import requests
import logging

logger = logging.getLogger(__name__)


async def must_list(project_name: str, bucket: str, prefix: str) -> List[str]:
    # give time for changes to propagate
    await asyncio.sleep(1)
    storage_client = client.Client(project=project_name)
    blobs = storage_client.list_blobs(bucket_or_name=bucket, prefix=prefix)
    res = [blob.name for blob in blobs]
    assert len(res), "failed to list objects!"
    return res


async def cleanup_blob_storage(project_name: str, bucket_name: str, prefix: str):
    blobs = await must_list(project_name, bucket_name, prefix)
    storage_client = client.Client(project=project_name)
    bucket = storage_client.bucket(bucket_name)

    for b in blobs:
        blob = bucket.blob(b)
        blob.delete()


def generate_download_signed_url_v4(
    project_name: str, bucket_name: str, blob_name: str
) -> str:
    credentials, project_id = google.auth.default(
        scopes=[
            "https://www.googleapis.com/auth/iam",
            "https://www.googleapis.com/auth/cloud-platform",
        ]
    )
    r = requests.Request()
    credentials.refresh(r)
    service_account_email = getattr(credentials, "service_account_email")
    if not service_account_email:
        logger.warning("service account email is empty!")
    storage_client = client.Client(project=project_name)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=60),
        method="GET",
        service_account_email=service_account_email,
        access_token=credentials.token,
    )

    return url
