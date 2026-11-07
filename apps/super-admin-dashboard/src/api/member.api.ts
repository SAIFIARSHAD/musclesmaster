import axiosInstance from './axiosInstance';
export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export interface MemberProfileDetails {
  _id: string;
  height?: number;
  weight?: number;
  bmi?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
}
export interface MemberProfileUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  createdAt?: string;
}
export interface MemberProfileBranch {
  _id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
}
export interface MemberProfileTrainer {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
  isActive: boolean;
}
export interface MemberDetails {
  _id: string;
  userId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;
  mobile: string;
  email: string;
  address?: string;
  branchId: string;
  membershipPlan?: string | null;
  startDate?: string;
  endDate?: string;
  trainerId?: string | null;
  status: MemberStatus;
  createdAt: string;
  updatedAt?: string;
}
export interface MemberByIdResponse {
  member: MemberDetails;
  profile: MemberProfileDetails | null;
  user: MemberProfileUser;
  branch: MemberProfileBranch | null;
  trainer: MemberProfileTrainer | null;
}

export const getMemberByIdApi = async (
  memberId: string,
): Promise<MemberByIdResponse> => {
  const response = await axiosInstance.get(
    `/members/${memberId}`,
  );

  return response.data.data;
};
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
export interface MemberProfile {
  _id: string;
  memberId: string;
  height?: number;
  weight?: number;
  bmi?: number;
  fitnessGoal?: string;
  medicalConditions: string[];
}

export interface MemberAccount {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface MemberBranch {
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
export interface MemberTrainer {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
  isActive: boolean;
}
export interface MemberDetailResult {
  member: MemberListItem;
  profile: MemberProfile | null;
  user: MemberAccount;
  branch: MemberBranch | null;
  trainer: MemberTrainer | null;
}
export interface UpdateMemberPayload {
  firstName?: string;
  lastName?: string;
  gender?: MemberGender;
  dob?: string;
  mobile?: string;
  email?: string;
  address?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
}
export interface UpdateMemberResult {
  member: MemberListItem;
  profile: MemberProfile;
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


interface UpdateMemberApiResponse {
  success: boolean;
  message: string;
  data: UpdateMemberResult;
}


// Update member personal and fitness details.
export const updateMemberApi = async (
  memberId: string,
  payload: UpdateMemberPayload,
): Promise<UpdateMemberResult> => {
  const response =
    await axiosInstance.put<UpdateMemberApiResponse>(
      `/members/${memberId}`,
      payload,
    );

  return response.data.data;
};
