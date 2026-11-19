import { http } from './axiosInstance';

import type {
  CreateStaffRequest,
  UpdateStaffRequest,
  UserListResponse,
  StaffResponse,
} from '../types/user.types';

export const getUsersApi = async (): Promise<UserListResponse> => {
  const response = await http.get<UserListResponse>('/users');
  return response.data;
};

export const createStaffApi = async (
  data: CreateStaffRequest,
): Promise<StaffResponse> => {
  const response = await http.post<StaffResponse>('/users', data);
  return response.data;
};

export const updateStaffApi = async (
  userId: string,
  data: UpdateStaffRequest,
): Promise<StaffResponse> => {
  const response = await http.put<StaffResponse>(
    `/users/${userId}`,
    data,
  );
  return response.data;
};

export const updateStaffStatusApi = async (
  userId: string,
  isActive: boolean,
): Promise<StaffResponse> => {
  const response = await http.patch<StaffResponse>(
    `/users/${userId}/status`,
    { isActive },
  );
  return response.data;
};

export const deleteStaffApi = async (
  userId: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await http.delete(`/users/${userId}`);
  return response.data;
};
