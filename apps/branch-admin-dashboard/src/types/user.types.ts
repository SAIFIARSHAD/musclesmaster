import type { UserRole } from './auth.types';
export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: 'RECEPTION' | 'TRAINER';
  branchId: string;
}

export interface UpdateStaffRequest {
  name?: string;
  email?: string;
  mobile?: string;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: StaffUser[];
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data: StaffUser;
}
