import { http } from './axiosInstance';

import type {
  CreateMemberRequest,
  Member,
  MemberDetailsResponse,
  MemberListParams,
  MemberListResponse,
  UpdateMemberRequest,
} from '../types/member.types';

// Fetch members with search, filters and pagination.
export const getMembersApi = async (
  params: MemberListParams = {},
): Promise<MemberListResponse> => {
  const response = await http.get<MemberListResponse>('/members', {
    params,
  });

  return response.data;
};

// Fetch a single member with profile, branch and trainer details.
export const getMemberByIdApi = async (
  memberId: string,
): Promise<MemberDetailsResponse> => {
  const response = await http.get<MemberDetailsResponse>(
    `/members/${memberId}`,
  );

  return response.data;
};

// Register a new member.
export const createMemberApi = async (
  data: CreateMemberRequest,
): Promise<{ success: boolean; message: string; data: Member }> => {
  const response = await http.post('/members', data);

  return response.data;
};

// Update member information.
export const updateMemberApi = async (
  memberId: string,
  data: UpdateMemberRequest,
): Promise<{ success: boolean; message: string; data: Member }> => {
  const response = await http.put(`/members/${memberId}`, data);

  return response.data;
};

// Assign or change a member's trainer.
export const updateMemberTrainerApi = async (
  memberId: string,
  trainerId: string | null,
): Promise<{ success: boolean; message: string; data: Member }> => {
  const response = await http.patch(`/members/${memberId}/trainer`, {
    trainerId,
  });

  return response.data;
};
