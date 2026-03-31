import api from './client';

export interface Suggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface LifeStageInfo {
  stage: string;
  title: string;
  description: string;
  icon: string;
  suggestedBundle: string[];
  confidence: number;
}

export const getSuggestions = () => 
  api.get<{ success: boolean; data: Suggestion[]; count: number }>('/api/assistant/suggestions')
    .then(res => res.data?.data || []);

export const predictLifeStage = () =>
  api.post<{ success: boolean; message: string; data: LifeStageInfo }>('/api/assistant/predict-stage')
    .then(res => res.data?.data);
