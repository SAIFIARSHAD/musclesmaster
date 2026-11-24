import { http } from './axiosInstance';
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
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}
interface MembershipPlanListResponse {
  success: boolean;
  message: string;
  data: MembershipPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getMembershipPlansApi = async (): Promise<
  MembershipPlan[]
> => {
  const response = await http.get<MembershipPlanListResponse>(
    '/membership-plans',
    {
      params: {
        page: 1,
        limit: 100,
        status: 'active',
      },
    },
  );

  return response.data.data;
};
