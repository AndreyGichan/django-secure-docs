export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const publicBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
    const privateBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

    return {
        publicKey: publicBase64,
        privateKey: privateBase64,
    };
};

export const toPEM = (base64Key: string, type: "PUBLIC" | "PRIVATE") => {
    const formatted = base64Key.match(/.{1,64}/g)?.join("\n");
    return `-----BEGIN ${type} KEY-----\n${formatted}\n-----END ${type} KEY-----`;
};

export const importPrivateKey = async (pem: string) => {
    if (!pem) throw new Error("Private key is missing");
    const base64Key = pem
        .replace(/-----BEGIN [A-Z ]+-----/g, "")
        .replace(/-----END [A-Z ]+-----/g, "")
        .replace(/\s+/g, "");
    const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "pkcs8",
        binary,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
};

export const importPublicKey = async (pem: string) => {
    if (!pem) throw new Error("User public key is missing");
    const base64Key = pem
        .replace(/-----BEGIN [A-Z ]+-----/g, "")
        .replace(/-----END [A-Z ]+-----/g, "")
        .replace(/\s+/g, "");
    const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "spki",
        binary,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
};

export const encryptDEKForUser = async (dek: Uint8Array, publicKey: CryptoKey) => {
    return new Uint8Array(await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        dek.buffer as ArrayBuffer
    ));
};

export const decryptDEK = async (encryptedDek: Uint8Array, privateKey: CryptoKey) => {
    return new Uint8Array(await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedDek.buffer as ArrayBuffer
    ));
};