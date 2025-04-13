import asyncio
from typing import List
from google.cloud.storage import client


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
