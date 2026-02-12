from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

def generate_dek() -> bytes:
    return Fernet.generate_key()

def encrypt_file(file_bytes: bytes, dek: bytes) -> bytes:
    f = Fernet(dek)
    return f.encrypt(file_bytes)

def decrypt_file(encrypted_bytes: bytes, dek: bytes) -> bytes:
    f = Fernet(dek)
    return f.decrypt(encrypted_bytes)

def encrypt_dek_for_user(dek: bytes, public_key_pem: bytes) -> bytes:
    public_key = serialization.load_pem_public_key(public_key_pem)
    encrypted_dek = public_key.encrypt( # type: ignore
        dek,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return encrypted_dek

def decrypt_dek_for_user(encrypted_dek: bytes, private_key_pem: bytes) -> bytes:
    if isinstance(encrypted_dek, memoryview):
        encrypted_dek = bytes(encrypted_dek)
        
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    dek = private_key.decrypt( # type: ignore
        encrypted_dek,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return dek
