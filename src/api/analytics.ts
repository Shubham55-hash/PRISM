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
  pendingRequests: number;
  trustScore: number;
  trustScoreHistory: TrustHistoryItem[];
}

export const getSummary = async () => {
  const res = await api.get<any>('/api/analytics/summary');
  return res.data?.data || res.data;
};

export const getTrustHistory = async () => {
  const res = await api.get<any>('/api/analytics/trust-history');
  return res.data?.data || res.data;
};

// Mock endpoints for UI fillers not yet in API Gateway
export const getNetworkReach = () => Promise.resolve({ institutions: 12, verifications: 89, totalConnections: 45 });
export const getInsights = () => Promise.resolve([
  { type: 'security', title: 'Security Boost', desc: 'Linking Aadhaar increased your score.' },
  { type: 'vault', title: 'Storage Alert', desc: 'You have 3 unstructured docs.' }
]);
