import axiosInstance from './axiosInstance';

// Membership Plan Types
export type MembershipPlanType =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'ANNUAL'
  | 'PERSONAL_TRAINING'
  | 'PREMIUM'
  | 'CORPORATE';

export type MembershipPlanStatus = 'ACTIVE' | 'INACTIVE';

export interface MembershipPlan {
  _id: string;
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded: boolean;
  status: MembershipPlanStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMembershipPlanPayload {
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded: boolean;
 }

export type UpdateMembershipPlanPayload =
  Partial<CreateMembershipPlanPayload> & {
    status?: MembershipPlanStatus;
  };

// Get all membership plans
export const getMembershipPlansApi = async (
  params?: Record<string, unknown>
) => {
  const response = await axiosInstance.get('/membership-plans', {
    params,
  });

  return response.data;
};

// Get membership plan by ID
export const getMembershipPlanByIdApi = async (id: string) => {
  const response = await axiosInstance.get(`/membership-plans/${id}`);

  return response.data;
};

// Create membership plan
export const createMembershipPlanApi = async (
  payload: CreateMembershipPlanPayload
) => {
  const response = await axiosInstance.post('/membership-plans', payload);

  return response.data;
};

// Update membership plan
export const updateMembershipPlanApi = async (
  id: string,
  payload: UpdateMembershipPlanPayload
) => {
  const response = await axiosInstance.put(
    `/membership-plans/${id}`,
    payload
  );

  return response.data;
};

// Delete membership plan
export const deleteMembershipPlanApi = async (id: string) => {
  const response = await axiosInstance.delete(`/membership-plans/${id}`);

  return response.data;
};