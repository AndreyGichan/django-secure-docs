import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes


def generate_dek() -> bytes:
    return os.urandom(32)

def encrypt_file(file_bytes: bytes, dek: bytes) -> bytes:
    nonce = os.urandom(12)  
    cipher = Cipher(algorithms.AES(dek), modes.GCM(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(file_bytes) + encryptor.finalize()
    return nonce + ciphertext + encryptor.tag

def decrypt_file(encrypted_bytes: bytes, dek: bytes) -> bytes:
    nonce = encrypted_bytes[:12]
    tag = encrypted_bytes[12:28]
    ciphertext = encrypted_bytes[28:]
    cipher = Cipher(algorithms.AES(dek), modes.GCM(nonce, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()

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
