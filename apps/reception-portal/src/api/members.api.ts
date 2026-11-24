import { http } from './axiosInstance';
// ==========================================
// CREATE MEMBER
// ==========================================
export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  mobile: string;
  email: string;
  password: string;
  address?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
  trainerId?: string;
}
export interface CreatedMember {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  userId: string;
  branchId: string;
  trainerId?: string | null;
  status: string;
}
interface CreateMemberResponse {
  success: boolean;
  message: string;
  data: {
    user: Record<string, unknown>;
    member: CreatedMember;
    profile: Record<string, unknown>;
  };
}

export const createMemberApi = async (
  payload: CreateMemberRequest,
): Promise<CreateMemberResponse['data']> => {
  const response = await http.post<CreateMemberResponse>(
    '/members',
    payload,
  );

  return response.data.data;
};

// ==========================================
// MEMBER LISTING
// ==========================================
export interface Member {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
  branchId: string;
  trainerId?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  membershipPlan?: string;
}
export interface MemberPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface MemberListResponse {
  success: boolean;
  message: string;
  data: Member[];
  pagination: MemberPagination;
}
export interface MemberListResult {
  members: Member[];
  pagination: MemberPagination;
}

export const getMembersApi = async (
  params: MemberListParams = {},
): Promise<MemberListResult> => {
  const response = await http.get<MemberListResponse>(
    '/members',
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...(params.search?.trim()
          ? { search: params.search.trim() }
          : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.membershipPlan
          ? { membershipPlan: params.membershipPlan }
          : {}),
      },
    },
  );

  return {
    members: response.data.data,
    pagination: response.data.pagination,
  };
};

// ==========================================
// MEMBER PROFILE / DETAILS
// ==========================================
export interface MemberProfile {
  _id?: string;
  memberId: string;
  height?: number;
  weight?: number;
  bmi?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
}
export interface MemberUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  createdAt?: string;
}
export interface MemberBranch {
  _id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}
export interface MemberTrainer {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  isActive: boolean;
}
export interface MemberDetails {
  member: Member;
  profile: MemberProfile | null;
  user: MemberUser;
  branch: MemberBranch | null;
  trainer: MemberTrainer | null;
}

interface MemberDetailsResponse {
  success: boolean;
  message: string;
  data: MemberDetails;
}

export const getMemberByIdApi = async (
  memberId: string,
): Promise<MemberDetails> => {
  const response = await http.get<MemberDetailsResponse>(
    `/members/${memberId}`,
  );

  return response.data.data;
};

// ==========================================
// UPDATE MEMBER - RECEPTION PERMISSIONS
// ==========================================
export interface UpdateMemberRequest {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  mobile: string;
  email?: string;
  address?: string;
}

export const updateMemberApi = async (
  memberId: string,
  payload: UpdateMemberRequest,
): Promise<void> => {
  await http.put(`/members/${memberId}`, payload);
};
