
import axiosInstance from './axiosInstance';

export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'FROZEN';

export type FreezeRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface MembershipPlanSummary {
  _id: string;
  planName: string;
  planType?: string;
  duration?: number;
  price?: number;
  ptIncluded?: boolean;
}

export interface MembershipMemberSummary {
  _id: string;
  memberId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}

export interface MembershipBranchSummary {
  _id: string;
  name?: string;
  code?: string;
}

export interface Membership {
  _id: string;
  memberId: MembershipMemberSummary | string;
  planId: MembershipPlanSummary | string;
  branchId?: MembershipBranchSummary | string;
  paymentId?: string | null;
  startDate: string;
  endDate?: string;
  status: MembershipStatus;
  freezeDays?: number;
  frozenAt?: string | null;
  freezeEndDate?: string | null;
  activatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MembershipPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MembershipListResponse {
  success: boolean;
  message: string;
  data: Membership[];
  pagination: MembershipPagination;
}

export interface MembershipListParams {
  page?: number;
  limit?: number;
  status?: MembershipStatus;
  memberId?: string;
  planId?: string;
  branchId?: string;
}

export interface AssignMembershipPayload {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}

export interface RenewMembershipPayload {
  planId: string;
  notes?: string;
}

export interface FreezeRequest {
  _id: string;
  membershipId: Membership & {
    memberId: MembershipMemberSummary;
    planId: MembershipPlanSummary;
  };
  memberId: MembershipMemberSummary | string;
  branchId?: MembershipBranchSummary | string;
  requestedDays: number;
  reason: string;
  status: FreezeRequestStatus;
  reviewedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | string | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FreezeRequestListResponse {
  success: boolean;
  message: string;
  data: FreezeRequest[];
  pagination: MembershipPagination;
}

export interface FreezeRequestListParams {
  status?: FreezeRequestStatus;
  page?: number;
  limit?: number;
}

export interface ReviewFreezeRequestPayload {
  decision: 'APPROVE' | 'REJECT';
  reviewNotes?: string;
}

// Assign a membership to a member.
export const assignMembershipApi = async (
  payload: AssignMembershipPayload
) => {
  const response = await axiosInstance.post('/memberships', payload);
  return response.data;
};

// Get memberships with pagination and filters.
export const getMembershipsApi = async (
  params: MembershipListParams = {}
): Promise<MembershipListResponse> => {
  const response = await axiosInstance.get('/memberships', { params });
  return response.data;
};

// Create a renewal membership.
export const renewMembershipApi = async (
  membershipId: string,
  payload: RenewMembershipPayload
) => {
  const response = await axiosInstance.post(
    `/memberships/${membershipId}/renew`,
    payload
  );

  return response.data;
};

// Get membership freeze requests.
export const getMembershipFreezeRequestsApi = async (
  params: FreezeRequestListParams = {}
): Promise<FreezeRequestListResponse> => {
  const response = await axiosInstance.get(
    '/memberships/freeze-requests',
    { params }
  );

  return response.data;
};

// Approve or reject a freeze request.
export const reviewMembershipFreezeRequestApi = async (
  requestId: string,
  payload: ReviewFreezeRequestPayload
) => {
  const response = await axiosInstance.patch(
    `/memberships/freeze-requests/${requestId}/review`,
    payload
  );

  return response.data;
};

// Manually unfreeze a membership.
export const unfreezeMembershipApi = async (
  membershipId: string
) => {
  const response = await axiosInstance.post(
    `/memberships/${membershipId}/unfreeze`
  );

  return response.data;
};
