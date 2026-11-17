import { http } from './axiosInstance';
import type { AuthUser } from './axiosInstance';
import { tokenManager } from './tokenManager';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export const loginApi = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await http.post<LoginResponse>(
    '/auth/login',
    data,
  );

  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  try {
    await http.post('/auth/logout');
  } finally {
    tokenManager.clearToken();
  }
};

export interface ReceptionBranch {
  _id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface BranchResponse {
  success: boolean;
  message: string;
  data: ReceptionBranch;
}

export const getReceptionBranchApi = async (): Promise<ReceptionBranch> => {
  const response = await http.get<BranchResponse>('/reception/branch');

  return response.data.data;
};