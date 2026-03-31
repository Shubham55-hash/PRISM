import axios, { AxiosError } from 'axios';

export const BASE_URL = 'http://127.0.0.1:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prism_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('prism_token');
      localStorage.removeItem('prism_refresh');
      window.location.href = '/login';
    }
    const status = error.response?.status || 500;
    const message = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message || 'Request failed';
    return Promise.reject(new ApiError(status, message));
  }
);

export default api;
