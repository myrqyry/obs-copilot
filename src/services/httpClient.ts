import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';

// Centralized HTTP client for backend communication
// - Dev: use relative '/api' so Vite proxy can forward to backend
// - Prod: use VITE_ADMIN_API_URL (full origin)
// - Automatically attaches X-API-KEY from VITE_ADMIN_API_KEY when present

function getBaseURL(): string {
  const env = (import.meta as { env: Record<string, string> }).env;
  const adminUrl = env?.VITE_ADMIN_API_URL;
  if (adminUrl && adminUrl.trim() !== '') {
    return adminUrl.replace(/\/+$/, ''); // remove trailing slash
  }
  // During local development we proxy /api/* to the backend via vite.config.ts
  return '/api';
}

const API_KEY = (import.meta as { env: Record<string, string> }).env?.VITE_ADMIN_API_KEY ?? '';

const httpClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Add timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// More efficient interceptor that only adds key when needed
httpClient.interceptors.request.use((config) => {
  if (API_KEY && !config.headers?.['X-API-KEY']) {
    config.headers = config.headers ?? {};
    config.headers['X-API-KEY'] = API_KEY;
  }
  return config;
});

// Global response interceptor to surface auth errors clearly
httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      logger.error('HTTP client authentication failure (401/403)');
      return Promise.reject(new Error('Authentication failed: invalid or missing X-API-KEY.'));
    }
    return Promise.reject(err);
  }
);

export { httpClient };
export type HttpClient = AxiosInstance;