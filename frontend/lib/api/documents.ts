import { API } from "./index";

export const getDocuments = () => API.get("documents/");
export const getDocument = (id: number) => API.get(`documents/${id}/`);
export const createDocument = (data: any) => API.post("documents/", data);
export const updateDocument = (id: number, data: any) => API.put(`documents/${id}/`, data);
export const deleteDocument = (id: number) => API.delete(`documents/${id}/`);
