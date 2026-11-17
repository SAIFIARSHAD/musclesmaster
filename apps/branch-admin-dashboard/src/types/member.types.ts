export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Member {
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

export interface MemberProfile {
  _id: string;
  memberId: string;

  height?: number;
  weight?: number;
  bmi?: number;

  fitnessGoal?: string;
  medicalConditions: string[];
}

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
  membershipPlan?: string;
}

export interface MemberPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MemberListResponse {
  success: boolean;
  message: string;
  data: Member[];
  pagination: MemberPagination;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;

  mobile: string;
  email: string;
  password: string;

  address?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
  trainerId?: string | null;
}

export type UpdateMemberRequest = Partial<
  Omit<CreateMemberRequest, 'password'>
>;

export interface MemberDetailsResponse {
  success: boolean;
  message: string;
  data: {
    member: Member;
    profile: MemberProfile | null;
    user: {
      _id: string;
      name: string;
      email: string;
      mobile: string;
    } | null;
    branch: {
      _id: string;
      name: string;
      code: string;
    } | null;
    trainer: {
      _id: string;
      name: string;
      email: string;
    } | null;
  };
}
