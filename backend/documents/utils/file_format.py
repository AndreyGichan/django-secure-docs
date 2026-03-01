import json
import struct
from uuid import UUID
from typing import Union


def build_encrypted_file_with_header(file_bytes: bytes, document_id: Union[str, UUID]) -> bytes:
    """
    Формат файла:

    [4 bytes header length]
    [header json]
    [original encrypted content (iv + ciphertext)]
    """

    header = {
        "documentId": str(document_id),
        "version": 1,
    }

    header_json = json.dumps(header).encode("utf-8")

    header_length = struct.pack(">I", len(header_json))  

    return header_length + header_json + file_bytes