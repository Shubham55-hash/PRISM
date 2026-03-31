import api from './client';

export interface Activity {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  entityName: string | null;
  entityType: string | null;
  createdAt: string;
  timeAgo: string;
  iconStyle: { color: string; bg: string };
}

export interface ActivityResponse {
  activities: Activity[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const activityApi = {
  list: (params?: { type?: string; page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    return api.get<ActivityResponse>(`/api/activity${qs.toString() ? '?' + qs.toString() : ''}`);
  },
};
