import api from './client';

export interface Identity {
  id: string;
  prismId: string;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  abhaId: string | null;
  digilockerLinked: boolean;
  biometricStatus: string;
  securityTier: number;
  trustScore: number;
  profilePhotoUrl: string | null;
  pendingRequests: number;
  bloodGroup: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  _count?: { documents: number; consents: number };
}

export interface PrismIdCard {
  prismId: string;
  fullName: string;
  profilePhotoUrl: string | null;
  securityTier: number;
  issuedOn: string;
  expiresOn: string;
}

export interface TrustScore {
  score: number;
  breakdown: { identity: number; documents: number; consents: number; activity: number; security: number };
  label: string;
}

export const identityApi = {
  getIdentity: () => api.get<Identity>('/api/identity').then(res => res.data),
  updateIdentity: (data: Partial<Identity>) => api.patch<{ message: string; user: Identity }>('/api/identity/profile', data).then(res => res.data),
  getPrismId: () => api.get<PrismIdCard>('/api/identity/prism-id').then(res => res.data),
  getTrustScore: () => api.get<TrustScore>('/api/identity/trust-score').then(res => res.data),
  linkAadhaar: (aadhaarNumber: string) => api.post('/api/identity/link-aadhaar', { aadhaarNumber }).then(res => res.data),
  linkAbha: (abhaId: string) => api.post('/api/identity/link-abha', { abhaId }).then(res => res.data),
  changePassword: (data: any) => api.post('/api/identity/change-password', data).then(res => res.data),
  deleteAccount: () => api.delete('/api/identity/account').then(res => res.data)
};
