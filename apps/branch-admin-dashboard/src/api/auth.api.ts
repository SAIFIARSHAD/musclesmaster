import { http } from './axiosInstance';
import { tokenManager } from './tokenManager';

import type {
  LoginRequest,
  LoginResponse,
  ApiResponse,
} from '../types/auth.types';

export const loginApi = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await http.post<LoginResponse>(
    '/auth/login',
    data,
  );

  tokenManager.setToken(response.data.data.accessToken);

  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  try {
    await http.post('/auth/logout');
  } finally {
    tokenManager.clearToken();
  }
};

export const forgotPasswordApi = async (
  data: { email: string },
): Promise<ApiResponse> => {
  const response = await http.post<ApiResponse>(
    '/auth/forgot-password',
    data,
  );

  return response.data;
};

export const verifyOtpApi = async (
  data: { email: string; otp: string },
) => {
  const response = await http.post('/auth/verify-otp', data);

  return response.data;
};

export const resetPasswordApi = async (
  data: {
    verifiedToken: string;
    newPassword: string;
    confirmPassword: string;
  },
): Promise<ApiResponse> => {
  const response = await http.post<ApiResponse>(
    '/auth/reset-password',
    data,
  );

  return response.data;
};