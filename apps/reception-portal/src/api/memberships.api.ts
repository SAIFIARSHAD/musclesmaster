
import { http } from './axiosInstance';

// ==========================================
// MEMBERSHIP TYPES
// ==========================================

export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'FROZEN'
  | 'EXPIRED';

export interface MembershipMember {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
}

export interface MembershipPlanInfo {
  _id: string;
  planName: string;
  planType: string;
  duration: number;
  price: number;
  ptIncluded?: boolean;
}

export interface MembershipBranch {
  _id: string;
  name: string;
  code?: string;
}

export interface Membership {
  _id: string;
  memberId: string | MembershipMember;
  planId: string | MembershipPlanInfo;
  branchId: string | MembershipBranch;
  agreedAmount: number;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  freezeDays: number;
  frozenAt?: string;
  freezeEndDate?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipSummary {
  total: number;
  active: number;
  pending: number;
  expired: number;
  frozen: number;
  expiringSoon: number;
}

export interface MembershipPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==========================================
// MEMBERSHIP LISTING
// ==========================================

export interface MembershipListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MembershipStatus | '';
  memberId?: string;
  planId?: string;
  branchId?: string;
  expiringSoon?: boolean;
}

interface MembershipListResponse {
  success: boolean;
  message: string;
  data: Membership[];
  pagination: MembershipPagination;
  summary: MembershipSummary;
}

export interface MembershipListResult {
  memberships: Membership[];
  pagination: MembershipPagination;
  summary: MembershipSummary;
}

export const getMembershipsApi = async (
  params: MembershipListParams = {},
): Promise<MembershipListResult> => {
  const response = await http.get<MembershipListResponse>(
    '/memberships',
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...(params.search?.trim()
          ? { search: params.search.trim() }
          : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.memberId ? { memberId: params.memberId } : {}),
        ...(params.planId ? { planId: params.planId } : {}),
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.expiringSoon
          ? { expiringSoon: 'true' }
          : {}),
      },
    },
  );

  return {
    memberships: response.data.data,
    pagination: response.data.pagination,
    summary: response.data.summary,
  };
};

// ==========================================
// ASSIGN MEMBERSHIP
// ==========================================

export interface AssignMembershipRequest {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}

interface AssignMembershipResponse {
  success: boolean;
  message: string;
  data: Membership;
}

export const assignMembershipApi = async (
  payload: AssignMembershipRequest,
): Promise<Membership> => {
  const response = await http.post<AssignMembershipResponse>(
    '/memberships',
    payload,
  );

  return response.data.data;
};

// ==========================================
// MEMBERSHIP DETAILS
// ==========================================

export interface MembershipHistory {
  _id: string;
  membershipId: string;
  memberId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  performedBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface MembershipDetails {
  membership: Membership;
  history: MembershipHistory[];
  paymentSummary?: Record<string, unknown>;
}

interface MembershipDetailsResponse {
  success: boolean;
  message: string;
  data: MembershipDetails;
}

export const getMembershipByIdApi = async (
  membershipId: string,
): Promise<MembershipDetails> => {
  const response = await http.get<MembershipDetailsResponse>(
    `/memberships/${membershipId}`,
  );

  return response.data.data;
};

// ==========================================
// RENEW MEMBERSHIP
// ==========================================

export interface RenewMembershipRequest {
  planId: string;
  notes?: string;
}

interface RenewMembershipResponse {
  success: boolean;
  message: string;
  data: Membership;
}

export const renewMembershipApi = async (
  membershipId: string,
  payload: RenewMembershipRequest,
): Promise<Membership> => {
  const response = await http.post<RenewMembershipResponse>(
    `/memberships/${membershipId}/renew`,
    payload,
  );

  return response.data.data;
};
