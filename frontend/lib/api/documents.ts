import { API } from "./index";
import { decryptDEK, importPrivateKey, } from "@/lib/crypto/keys";

interface GetDocumentsParams {
    search?: string;
    status?: string;
    type?: string;
    owner?: string;
    ordering?: string;
    limit?: number;
    offset?: number;
}

export const getDocuments = (params?: GetDocumentsParams) => API.get("documents/", { params });
export const getDocument = (id: string) => API.get(`documents/${id}/`);
export const createDocument = (data: FormData) => API.post("documents/", data);
export const updateDocument = (id: string, data: any) => API.patch(`documents/${id}/`, data);
export const deleteDocument = (id: string) => API.delete(`documents/${id}/`);
export const uploadDocumentVersion = (documentId: string, data: FormData) => API.post(`documents/${documentId}/upload_version/`, data);
export const getDocumentVersions = (documentId: string) =>
    API.get(`documents/${documentId}/versions/`);
export const approveDocumentVersion = (
    documentId: string,
    versionId: number
) =>
    API.post(`documents/${documentId}/approve_version/`, {
        version_id: versionId,
    });
export const shareDocument = (documentId: string, data: {
    user_id: string;
    role: string;
    comment?: string;
    days?: number;
}) => API.post(`documents/${documentId}/share/`, data);

export const getDocumentAccess = (documentId: string) => API.get(`documents/${documentId}/access_list/`);

export const updateDocumentAccess = (
    documentId: string,
    userId: string,
    data: any
) => API.patch(`documents/${documentId}/access/${userId}/`, data)

export const revokeDocumentAccess = (
    documentId: string,
    userId: string
) => API.post(`documents/${documentId}/revoke/${userId}/`);

export const getMyEncryptedDEK = (documentId: string) => {
    return API.get(`documents/${documentId}/my_dek/`);
};

export const createDownloadLink = async (documentId: string) => {
    const { data } = await API.post(`documents/${documentId}/create_download_link/`);
    return data.token;
};

export const downloadEncrypted = async (token: string, documentTitle: string, documentType: string) => {
    const blob = await API.get(`documents/download/${token}/`, { responseType: "blob" }).then(res => res.data);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documentTitle}.${documentType}.enc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const downloadDecrypted = async (
    token: string,
    documentId: string,
    privateKeyFile: File,
    documentTitle: string,
    documentType: string
) => {
    if (!privateKeyFile) throw new Error("Не выбран приватный ключ");

    const pem = await privateKeyFile.text();
    const privateKey = await importPrivateKey(pem);

    const { data: dekResponse } = await getMyEncryptedDEK(documentId)
    const encryptedDek = Uint8Array.from(atob(dekResponse.encrypted_dek), c => c.charCodeAt(0));
    const dekBytes = await decryptDEK(encryptedDek, privateKey);

    const encryptedFileBuffer = await API.get(`documents/download/${token}/`, { responseType: "arraybuffer" }).then(res => res.data);
    const encryptedData = new Uint8Array(encryptedFileBuffer);

    const iv = encryptedData.slice(0, 12);
    const ciphertextWithTag = encryptedData.slice(12);



    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        new Uint8Array(dekBytes),
        "AES-GCM",
        false,
        ["decrypt"]
    );

    const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ciphertextWithTag
    );

    const blob = new Blob([new Uint8Array(decryptedArrayBuffer)]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documentTitle}.${documentType}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
};