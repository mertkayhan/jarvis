import os
from typing import Any, BinaryIO, Generator, Optional, Union
from google.cloud.storage import client, Blob
import logging
from abc import abstractmethod

logger = logging.getLogger(__name__)


class Storage:
    @abstractmethod
    def write(self, file_obj: BinaryIO, target: str):
        raise NotImplementedError

    @abstractmethod
    def read(self, blob: Union[Blob, str]) -> bytes:
        raise NotImplementedError

    @abstractmethod
    def delete(self, blob: Union[Blob, str]):
        raise NotImplementedError

    @abstractmethod
    def list(self, prefix: str) -> Generator[Any, Any, None]:
        raise NotImplementedError

    @abstractmethod
    def generate_presigned_url(self, blob: Union[str, Union[Blob, str]]) -> str:
        raise NotImplementedError
