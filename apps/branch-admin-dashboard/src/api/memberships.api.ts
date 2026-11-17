import { http } from './axiosInstance';

import type {
  AssignMembershipRequest,
  Membership,
  MembershipDetailsResponse,
  MembershipListParams,
  MembershipListResponse,
  RenewMembershipRequest,
  FreezeRequestListParams,
  FreezeRequestListResponse,
  ReviewFreezeRequestPayload,
  MembershipFreezeRequest,
} from '../types/membership.types';

// ==========================================
// MEMBERSHIP APIs
// ==========================================

// Fetch memberships with filters and pagination.
export const getMembershipsApi = async (
  params: MembershipListParams = {},
): Promise<MembershipListResponse> => {
  const response = await http.get<MembershipListResponse>(
    '/memberships',
    { params },
  );

  return response.data;
};

// Fetch membership details and history.
export const getMembershipByIdApi = async (
  membershipId: string,
): Promise<MembershipDetailsResponse> => {
  const response = await http.get<MembershipDetailsResponse>(
    `/memberships/${membershipId}`,
  );

  return response.data;
};

// Assign a membership to a member.
export const assignMembershipApi = async (
  data: AssignMembershipRequest,
): Promise<{
  success: boolean;
  message: string;
  data: Membership;
}> => {
  const response = await http.post('/memberships', data);

  return response.data;
};

// Renew an existing membership.
export const renewMembershipApi = async (
  membershipId: string,
  data: RenewMembershipRequest,
): Promise<{
  success: boolean;
  message: string;
  data: Membership;
}> => {
  const response = await http.post(
    `/memberships/${membershipId}/renew`,
    data,
  );

  return response.data;
};

// ==========================================
// MEMBERSHIP FREEZE REQUEST APIs
// ==========================================

// Fetch freeze requests with filters and pagination.
export const getMembershipFreezeRequestsApi = async (
  params: FreezeRequestListParams = {},
): Promise<FreezeRequestListResponse> => {
  const response = await http.get<FreezeRequestListResponse>(
    '/memberships/freeze-requests',
    { params },
  );

  return response.data;
};

// Approve or reject a membership freeze request.
export const reviewMembershipFreezeRequestApi = async (
  requestId: string,
  payload: ReviewFreezeRequestPayload,
): Promise<{
  success: boolean;
  message: string;
  data: MembershipFreezeRequest;
}> => {
  const response = await http.patch(
    `/memberships/freeze-requests/${requestId}/review`,
    payload,
  );

  return response.data;
};

// Manually unfreeze a frozen membership.
export const unfreezeMembershipApi = async (
  membershipId: string,
): Promise<{
  success: boolean;
  message: string;
  data: Membership;
}> => {
  const response = await http.post(
    `/memberships/${membershipId}/unfreeze`,
  );

  return response.data;
};
