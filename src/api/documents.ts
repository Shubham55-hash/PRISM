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
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const documentsApi = {
  list: (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return api.get<DocumentsResponse>(`/api/documents${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  upload: (file: File, name?: string, documentType?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (documentType) formData.append('documentType', documentType);
    return api.upload<{ message: string; document: Document }>('/api/documents/upload', formData);
  },
  getById: (id: string) => api.get<Document>(`/api/documents/${id}`),
  delete: (id: string) => api.delete<{ message: string }>(`/api/documents/${id}`),
  verify: (id: string) => api.post<{ message: string; vcCredentialId: string; isVerified: boolean }>(`/api/documents/${id}/verify`),
  getDownloadUrl: (id: string) => api.get<{ downloadUrl: string; expiresIn: number }>(`/api/documents/${id}/download`),
};
