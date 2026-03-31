import api from './client';

export const getTrustHistory = () => api.get<{ name: string; score: number }[]>('/api/analytics/trust-trend').then(res => res.data);
export const getVerificationVelocity = () => api.get<{ name: string; count: number }[]>('/api/analytics/verification-velocity').then(res => res.data);
export const getDataDistribution = () => api.get<{ name: string; value: number; color: string }[]>('/api/analytics/data-distribution').then(res => res.data);
export const getNetworkReach = () => api.get<{ institutions: number; verifications: number; totalConnections: number }>('/api/analytics/network-reach').then(res => res.data);
export const getInsights = () => api.get<{ type: string; title: string; desc: string }[]>('/api/analytics/insights').then(res => res.data);
export const getSummary = () => api.get<{ totalDocuments: number; activeConsents: number; pendingRequests: number }>('/api/analytics/dashboard-stats').then(res => res.data);
