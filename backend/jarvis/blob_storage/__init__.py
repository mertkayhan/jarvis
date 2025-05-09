import os
from jarvis.blob_storage.gcs import GCS
from jarvis.blob_storage.s3 import S3
from jarvis.blob_storage.storage import Storage


def resolve_storage() -> Storage:
    bucket = os.getenv("DOCUMENT_BUCKET")
    assert bucket, "'DOCUMENT_BUCKET' is not set!"

    if bucket.startswith("gs://"):
        return GCS(bucket_name=bucket.lstrip("gs://"))
    elif bucket.startswith("s3://"):
        return S3(
            bucket_name=bucket.lstrip("s3://"),
            access_key=os.getenv("AWS_ACCESS_KEY_ID"),
            secret_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
        )
    else:
        raise ValueError("bucket name should either start with 'gs://' or 's3://'")
