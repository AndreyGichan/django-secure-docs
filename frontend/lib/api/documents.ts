import { API } from "./index";

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
