import api from './client';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface CrisisProfile {
  name: string;
  age: number | null;
  phone: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  emergencyContact: EmergencyContact;
  aadhaarHash: string | null;
  abhaId: string | null;
  medicalDocuments: any[];
  lastUpdated: string;
}

export const getCrisisProfile = () =>
  api.get<{ success: boolean; data: CrisisProfile }>('/api/crisis/profile')
    .then(res => res.data?.data);

export const activateCrisisMode = () =>
  api.post<{ success: boolean; message: string; data: { token: string; expiresAt: string } }>('/api/crisis/activate')
    .then(res => res.data?.data);

export const deactivateCrisisMode = (token: string) =>
  api.post<{ success: boolean; message: string }>(`/api/crisis/deactivate/${token}`)
    .then(res => res.data);
