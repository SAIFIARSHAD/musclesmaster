export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_ADMIN'
  | 'RECEPTION'
  | 'TRAINER'
  | 'MEMBER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
}