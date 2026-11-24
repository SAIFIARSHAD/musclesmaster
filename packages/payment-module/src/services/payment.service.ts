import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from '../types/api.types';
import type {
  CreateMembershipPaymentInput,
  CreateMembershipPaymentResult,
  MembershipPaymentSummary,
  Payment,
  PaymentHistoryFilters,
  PaymentDashboardFilters,
  PaymentDashboardSummary,
  OutstandingDuesFilters,
OutstandingDue,
} from '../types/payment.types';

export const createPaymentService = (http: AxiosInstance) => ({
  async collectMembershipPayment(
    input: CreateMembershipPaymentInput,
  ): Promise<ApiResponse<CreateMembershipPaymentResult>> {
    const response = await http.post('/payments/membership', input);
    return response.data;
  },

  async getPaymentHistory(
    filters: PaymentHistoryFilters = {},
  ): Promise<PaginatedApiResponse<Payment>> {
    const response = await http.get('/payments/history', {
      params: filters,
    });

    return response.data;
  },

  async getMembershipPaymentSummary(
    membershipId: string,
  ): Promise<ApiResponse<MembershipPaymentSummary>> {
    const response = await http.get(
      `/payments/membership/${membershipId}/summary`,
    );

    return response.data;
  },

  async getDashboardSummary(
  filters: PaymentDashboardFilters = {},
): Promise<ApiResponse<PaymentDashboardSummary>> {
  const response = await http.get(
    '/payments/dashboard-summary',
    { params: filters },
  );

  return response.data;
},


async getOutstandingDues(
  filters: OutstandingDuesFilters = {},
): Promise<ApiResponse<OutstandingDue[]> & {
  pagination: import('../types/payment.types').PaymentPagination;
}> {
  const response = await http.get(
    '/payments/outstanding-dues',
    { params: filters },
  );

  return response.data;
},


  async getPaymentAuditHistory(
    paymentId: string,
    params: {
      page?: number;
      limit?: number;
      action?: string;
    } = {},
  ) {
    const response = await http.get(
      `/payments/${paymentId}/audit-history`,
      { params },
    );

    return response.data;
  },
});

export type PaymentService = ReturnType<typeof createPaymentService>;