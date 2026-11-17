import axios from 'axios';
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { tokenManager } from './tokenManager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
}

interface RefreshResult {
  accessToken: string;
  user: AuthUser;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not configured');
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<RefreshResult> | null = null;

export const refreshAccessToken = async (): Promise<RefreshResult> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((response) => {
        const accessToken = response.data?.data?.accessToken;
        const user = response.data?.data?.user;

        if (
          typeof accessToken !== 'string' ||
          !accessToken ||
          !user?.id ||
          !user?.role
        ) {
          throw new Error('Invalid refresh response');
        }

        tokenManager.setToken(accessToken);

        return {
          accessToken,
          user: user as AuthUser,
        };
      })
      .catch((error) => {
        tokenManager.clearToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Attach access token to requests.
http.interceptors.request.use((config) => {
  const token = tokenManager.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Refresh access token when the current token expires.
http.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout') ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { accessToken } = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return http(originalRequest);
    } catch (refreshError) {
      tokenManager.clearToken();

      window.dispatchEvent(new Event('auth:session-expired'));

      return Promise.reject(refreshError);
    }
  },
);