import api from './client';

export interface Consent {
  id: string;
  institutionName: string;
  institutionId: string | null;
  purpose: string;
  accessTier: number;
  allowedFields: string[];
  status: string;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  institutionLogoUrl: string | null;
  isExpired: boolean;
}

export const consentsApi = {
  list: (status?: string) => api.get<Consent[]>(`/api/consents${status ? '?status=' + status : ''}`),
  create: (data: { institutionName: string; purpose: string; accessTier?: number; allowedFields?: string[]; expiryDays?: number; institutionLogoUrl?: string }) =>
    api.post<{ message: string; consent: Consent }>('/api/consents', data),
  getById: (id: string) => api.get<Consent & { auditLog: any[] }>(`/api/consents/${id}`),
  revoke: (id: string) => api.delete<{ message: string }>(`/api/consents/${id}`),
  extend: (id: string, additionalDays?: number) => api.post(`/api/consents/${id}/extend`, { additionalDays }),
  getAuditLog: () => api.get<any[]>('/api/consents/audit-log'),
};
