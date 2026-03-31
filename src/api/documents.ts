import api from './client';

export interface Document {
  id: string;
  name: string;
  originalFilename: string | null;
  documentType: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  isVerified: boolean;
  vcCredentialId: string | null;
  vcIssuedAt: string | null;
  vcExpiresAt: string | null;
  uploadSource: string;
  createdAt: string;
  sizeFormatted: string;
  dateAdded: string;
  ocrExtractedFields?: any;
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const getDocuments = (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
  return api.get<DocumentsResponse>('/api/documents', { params }).then(res => res.data);
};

export const uploadDocument = (file: File, name?: string, documentType?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (documentType) formData.append('documentType', documentType);
  return api.post<{ message: string; document: Document }>('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const getDocumentById = (id: string) => api.get<Document>(`/api/documents/${id}`).then(res => res.data);
export const deleteDocument = (id: string) => api.delete<{ message: string }>(`/api/documents/${id}`).then(res => res.data);
export const verifyDocument = (id: string) => api.post<{ message: string; vcCredentialId: string; isVerified: boolean }>(`/api/documents/${id}/verify`).then(res => res.data);
export const getDownloadUrl = (id: string) => api.get<{ downloadUrl: string; expiresIn: number }>(`/api/documents/${id}/download`).then(res => res.data);
