
import axiosInstance from './axiosInstance';

export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateMemberPayload {
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;
  mobile: string;
  email: string;
  password: string;
  branchId?: string;
  address?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
  trainerId?: string | null;
}

export interface CreatedMember {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
  branchId: string;
  trainerId?: string | null;
  status: MemberStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatedMemberProfile {
  _id: string;
  memberId: string;
  height?: number;
  weight?: number;
  bmi?: number;
  fitnessGoal?: string;
  medicalConditions: string[];
}

export interface CreatedMemberUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
}

export interface CreateMemberResult {
  user: CreatedMemberUser;
  member: CreatedMember;
  profile: CreatedMemberProfile;
}

export interface MemberListItem {
  _id: string;
  userId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
  branchId: string;
  membershipPlan?: string | null;
  startDate?: string;
  endDate?: string;
  trainerId?: string | null;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MemberPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
  branchId?: string;
  membershipPlan?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface MemberListApiResponse {
  success: boolean;
  message: string;
  data: MemberListItem[];
  pagination: MemberPagination;
}

// Register a new member
export const createMemberApi = async (
  payload: CreateMemberPayload,
): Promise<CreateMemberResult> => {
  const response = await axiosInstance.post<ApiResponse<CreateMemberResult>>(
    '/members',
    payload,
  );

  return response.data.data;
};

// Get members with search, filters and pagination
export const getMembersApi = async (
  params: MemberListParams = {},
): Promise<{
  members: MemberListItem[];
  pagination: MemberPagination;
}> => {
  const response = await axiosInstance.get<MemberListApiResponse>(
    '/members',
    {
      params,
    },
  );

  return {
    members: response.data.data,
    pagination: response.data.pagination,
  };
};
