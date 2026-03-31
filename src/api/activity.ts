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

export const getActivity = (params?: { type?: string; page?: number; limit?: number; search?: string }) => {
  return api.get<ActivityResponse>('/api/activity', { params }).then(res => res.data);
};
