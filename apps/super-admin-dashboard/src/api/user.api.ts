import axiosInstance from './axiosInstance';
export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_ADMIN'
  | 'RECEPTION'
  | 'TRAINER'
  | 'MEMBER';
export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  branchId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  branchId?: string;
}
export interface UpdateUserPayload {
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  branchId?: string | null;
}
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getUsersApi = async (): Promise<ManagedUser[]> => {
  const response =
    await axiosInstance.get<ApiResponse<ManagedUser[]>>('/users');

  return response.data.data;
};

export const createUserApi = async (
  payload: CreateUserPayload,
): Promise<ManagedUser> => {
  const response =
    await axiosInstance.post<ApiResponse<ManagedUser>>('/users', payload);

  return response.data.data;
};

export const updateUserApi = async (
  userId: string,
  payload: UpdateUserPayload,
): Promise<ManagedUser> => {
  const response = await axiosInstance.put<ApiResponse<ManagedUser>>(
    `/users/${userId}`,
    payload,
  );

  return response.data.data;
};

export const updateUserStatusApi = async (
  userId: string,
  isActive: boolean,
): Promise<ManagedUser> => {
  const response = await axiosInstance.patch<ApiResponse<ManagedUser>>(
    `/users/${userId}/status`,
    { isActive },
  );

  return response.data.data;
};

export const deleteUserApi = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`/users/${userId}`);
};
