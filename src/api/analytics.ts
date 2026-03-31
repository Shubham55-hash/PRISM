import api from './client';

export interface TrustHistoryItem {
  year: number;
  month: number;
  score: number;
  id?: string;
  userId?: string;
}

export interface AnalyticsSummary {
  totalDocuments: number;
  verifiedDocuments: number;
  activeConsents: number;
  trustScore: number;
  trustScoreHistory: TrustHistoryItem[];
}

export const getSummary = () => api.get<{ data: AnalyticsSummary }>('/api/analytics/summary').then((res: any) => res.data?.data || res.data || res);
export const getTrustHistory = () => api.get<{ data: TrustHistoryItem[] }>('/api/analytics/trust-history').then((res: any) => res.data?.data || res.data || res);

// Mock endpoints for UI fillers not yet in API Gateway
export const getNetworkReach = () => Promise.resolve({ institutions: 12, verifications: 89, totalConnections: 45 });
export const getInsights = () => Promise.resolve([
  { type: 'security', title: 'Security Boost', desc: 'Linking Aadhaar increased your score.' },
  { type: 'vault', title: 'Storage Alert', desc: 'You have 3 unstructured docs.' }
]);
