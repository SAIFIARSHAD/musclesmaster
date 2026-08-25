export interface IUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: IUser;
  };
}