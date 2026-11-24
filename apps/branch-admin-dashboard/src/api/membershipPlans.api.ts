import { http } from './axiosInstance';
import type {
  MembershipPlanListResponse,
} from '../types/membership.types';

export const getMembershipPlansApi = async () => {
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
