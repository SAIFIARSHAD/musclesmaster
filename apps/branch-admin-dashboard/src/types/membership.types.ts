export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'FROZEN';

export type MembershipPlanStatus = 'ACTIVE' | 'INACTIVE';

export type MembershipPlanType =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'ANNUAL'
  | 'PERSONAL_TRAINING'
  | 'PREMIUM'
  | 'CORPORATE';

export interface MembershipPlan {
  _id: string;
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded: boolean;
  status: MembershipPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipMember {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
}

export interface MembershipBranch {
  _id: string;
  name: string;
  code: string;
}

export interface Membership {
  _id: string;

  memberId: MembershipMember | string;
  planId: MembershipPlan | string;
  branchId: MembershipBranch | string;

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

export interface MembershipPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MembershipListParams {
  page?: number;
  limit?: number;
  status?: MembershipStatus;
  memberId?: string;
  planId?: string;
}

export interface MembershipListResponse {
  success: boolean;
  message: string;
  data: Membership[];
  pagination: MembershipPagination;
}

export interface AssignMembershipRequest {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}

export interface MembershipDetailsResponse {
  success: boolean;
  message: string;
  data: {
    membership: Membership;
    history: MembershipHistory[];
  };
}

export interface MembershipHistory {
  _id: string;
  membershipId: string;
  memberId: string;
  branchId: string;
  action: string;
  previousStatus?: MembershipStatus;
  newStatus?: MembershipStatus;
  performedBy: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface MembershipPlanListResponse {
  success: boolean;
  message: string;
  data: MembershipPlan[];
  pagination: MembershipPagination;
}

export interface RenewMembershipRequest {
  planId: string;
  notes?: string;
}

// ==========================================
// MEMBERSHIP FREEZE REQUEST TYPES
// ==========================================

export type FreezeRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface MembershipFreezeRequest {
  _id: string;

  membershipId: Membership | string;
  memberId: MembershipMember | string;
  branchId: MembershipBranch | string;

  requestedDays: number;
  reason: string;

  status: FreezeRequestStatus;

  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;

  reviewedAt?: string;
  reviewNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FreezeRequestListParams {
  page?: number;
  limit?: number;
  status?: FreezeRequestStatus;
}

export interface FreezeRequestListResponse {
  success: boolean;
  message: string;
  data: MembershipFreezeRequest[];
  pagination: MembershipPagination;
}

export interface ReviewFreezeRequestPayload {
  decision: 'APPROVE' | 'REJECT';
  reviewNotes?: string;
}
