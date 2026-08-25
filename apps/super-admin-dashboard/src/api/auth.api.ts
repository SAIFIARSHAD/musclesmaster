import axiosInstance from './axiosInstance';
import type { LoginRequest, LoginResponse } from '../types/auth.types';


export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data);
  return response.data;
};


export const logoutApi = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};

export const forgotPasswordApi = (data: { email: string }) =>
  axiosInstance.post('/auth/forgot-password', data);


export const verifyOtpApi = (data: { email: string; otp: string }) =>
  axiosInstance.post('/auth/verify-otp', data);


export const resetPasswordApi = (data: { verifiedToken: string; newPassword: string }) =>
  axiosInstance.post('/auth/reset-password', data);