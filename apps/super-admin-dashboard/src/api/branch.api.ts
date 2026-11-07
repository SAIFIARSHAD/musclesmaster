import axiosInstance from './axiosInstance';
export interface Branch {
  _id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  managerId?: string | null;
  gstNumber?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface BranchPayload {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
}
export interface BranchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface BranchListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedBranchResponse extends ApiResponse<Branch[]> {
  pagination: BranchPagination;
}

export const getBranchesApi = async (): Promise<Branch[]> => {
  const response = await axiosInstance.get<ApiResponse<Branch[]>>(
    '/branches',
    {
      params: {
        page: 1,
        limit: 100,
        status: 'all',
      },
    },
  );

  return response.data.data;
};

export const getBranchesPageApi = async (
  params: BranchListParams = {},
): Promise<{
  data: Branch[];
  pagination: BranchPagination;
}> => {
  const response =
    await axiosInstance.get<PaginatedBranchResponse>('/branches', {
      params,
    });

  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const getAvailableBranchesForManagerApi =
  async (): Promise<Branch[]> => {
    const response = await axiosInstance.get<ApiResponse<Branch[]>>(
      '/branches/available-for-manager',
    );

    return response.data.data;
  };

export const createBranchApi = async (
  payload: BranchPayload,
): Promise<Branch> => {
  const response = await axiosInstance.post<ApiResponse<Branch>>(
    '/branches',
    payload,
  );

  return response.data.data;
};

export const updateBranchApi = async (
  branchId: string,
  payload: Partial<BranchPayload>,
): Promise<Branch> => {
  const response = await axiosInstance.put<ApiResponse<Branch>>(
    `/branches/${branchId}`,
    payload,
  );

  return response.data.data;
};

export const updateBranchStatusApi = async (
  branchId: string,
  isActive: boolean,
): Promise<Branch> => {
  const response = await axiosInstance.patch<ApiResponse<Branch>>(
    `/branches/${branchId}/status`,
    { isActive },
  );

  return response.data.data;
};
