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