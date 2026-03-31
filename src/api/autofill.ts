import api from './client';

export interface AutofillToken {
    id: string;
    institutionName: string;
    purpose: string;
    allowedFields: string | string[];
    consentToken: string;
    status: string;
    grantedAt: string;
    expiresAt: string;
    revokedAt: string | null;
    lastAccessedAt: string | null;
    accessCount: number;
}

export interface AutofillProfile {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    prismId?: string;
    abhaId?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    passportNumber?: string;
    gender?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    annualIncome?: string;
    educationInstitution?: string;
    degree?: string;
    graduationYear?: string;
    employer?: string;
    designation?: string;
    bloodGroup?: string;
    digilockerLinked?: boolean;
    aadhaarVerified?: boolean;
}

export const getAutofillProfile = () =>
    api.get<{ success: boolean; data: AutofillProfile }>('/api/autofill/profile').then(r => r.data.data);

export const getAutofillTokens = () =>
    api.get<{ success: boolean; data: AutofillToken[] }>('/api/autofill/tokens').then(r => r.data.data);

export const createAutofillToken = (data: {
    appName: string;
    purpose: string;
    allowedFields: string[];
    expiresAt: string;
}) =>
    api.post<{ success: boolean; data: { consentToken: string; consent: AutofillToken } }>('/api/autofill/token', data).then(r => r.data.data);

export const revokeAutofillToken = (id: string) =>
    api.patch<{ success: boolean; message: string }>(`/api/autofill/tokens/${id}/revoke`).then(r => r.data);