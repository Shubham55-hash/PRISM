import api from './client';

export interface Consent {
  id: string;
  institutionName: string;
  institutionId: string | null;
  purpose: string;
  accessTier: number;
  allowedFields: string | string[] | null;
  consentToken: string;
  status: string;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  institutionLogoUrl: string | null;
  isExpired?: boolean;
}

export const getConsents = (status?: string) => api.get<{ success: boolean; data: Consent[] }>('/api/consents', { params: { status: status || undefined } }).then(res => res.data.data);
export const createConsent = (data: { institutionName: string; purpose: string; accessTier?: number; allowedFields?: string[]; expiryDays?: number; expiresAt?: string; institutionLogoUrl?: string }) =>
  api.post<{ success: boolean; message: string; data: Consent }>('/api/consents', data).then(res => res.data.data);
export const getConsentById = (id: string) => api.get<Consent & { auditLog: any[] }>(`/api/consents/${id}`).then(res => res.data);
export const revokeConsent = (id: string) => api.patch<{ success: boolean; message: string }>(`/api/consents/${id}/revoke`).then(res => res.data);
export const extendConsent = (id: string, additionalDays?: number) => api.post(`/api/consents/${id}/extend`, { additionalDays }).then(res => res.data);
export const getConsentAuditLog = () => api.get<any[]>('/api/consents/audit-log').then(res => res.data);
