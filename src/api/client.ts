// src/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from '@/shared/constants/api';

// Custom error class
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message;

    // Handle specific error codes
    if (statusCode === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (statusCode === 403) {
      toast.error('Permission denied');
    } else if (statusCode >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(
      new APIError(statusCode, message, error.response?.data)
    );
  }
);

// Retry logic wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof APIError && error.statusCode >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}
