import api from './client';

export interface LifeStagePrediction {
  id: string;
  userId: string;
  predictedStage: string;
  title: string;
  description: string;
  confidence: number;
  suggestedBundle: string | null;
  isActioned: boolean;
  predictedAt: string;
}

export const predictionsApi = {
  getLifeEvents: async (): Promise<LifeStagePrediction[]> => {
    const response = await api.get('/api/predictions/life-events');
    return response.data.data.predictions;
  },

  analyzeUser: async (): Promise<LifeStagePrediction[]> => {
    const response = await api.post('/api/predictions/analyze');
    return response.data.data.newPredictions;
  },

  actionPrediction: async (id: string): Promise<LifeStagePrediction> => {
    const response = await api.put(`/api/predictions/${id}/action`);
    return response.data.data.prediction;
  }
};
