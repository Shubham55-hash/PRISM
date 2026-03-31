import api from './client';

export const analyticsApi = {
  getTrustTrend: () => api.get<{ name: string; score: number }[]>('/api/analytics/trust-trend'),
  getVerificationVelocity: () => api.get<{ name: string; count: number }[]>('/api/analytics/verification-velocity'),
  getDataDistribution: () => api.get<{ name: string; value: number; color: string }[]>('/api/analytics/data-distribution'),
  getNetworkReach: () => api.get<{ institutions: number; verifications: number; totalConnections: number }>('/api/analytics/network-reach'),
  getInsights: () => api.get<{ type: string; title: string; desc: string }[]>('/api/analytics/insights'),
  getDashboardStats: () => api.get<{ totalDocuments: number; activeConsents: number; pendingRequests: number }>('/api/analytics/dashboard-stats'),
};
