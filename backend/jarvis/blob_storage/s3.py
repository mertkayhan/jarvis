import io
from typing import Any, BinaryIO, Generator, Optional
from jarvis.blob_storage.storage import Storage
import boto3


class S3(Storage):
    def __init__(
        self,
        bucket_name: str,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        endpoint_url: Optional[str] = None,
    ):
        self.bucket_name = bucket_name
        self.client = boto3.client(
            service_name="s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url,
        )

    def read(self, blob: str) -> bytes:
        buf = io.BytesIO()
        self.client.download_fileobj(
            self.bucket_name,
            blob,
            buf,
        )
        return buf.getvalue()

    def write(self, file_obj: BinaryIO, target: str):
        self.client.upload_fileobj(
            file_obj,
            self.bucket_name,
            target,
        )

    def list(self, prefix: str) -> Generator[Any, Any, None]:
        bucket = self.client.Bucket(self.bucket_name)
        yield from bucket.objects.filter(Prefix=prefix)

    def delete(self, blob: str):
        self.client.delete_object(self.bucket_name, blob)

    def generate_presigned_url(self, blob: str) -> str:
        response = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": blob},
            ExpiresIn=3600,
        )
        return response
