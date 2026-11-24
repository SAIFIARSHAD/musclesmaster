import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '../types/api.types';
import type {
  CreateRefundRequestInput,
  ProcessRefundInput,
  ProcessRefundResult,
  Refund,
  ReviewRefundRequestInput,
} from '../types/refund.types';

export const createRefundService = (http: AxiosInstance) => ({
  async createRefundRequest(
    input: CreateRefundRequestInput,
  ) {
    const response = await http.post('/refunds', input);

    return response.data as {
      success: boolean;
      message: string;
      data: Refund;
      remainingRefundable: number;
      alreadyProcessed: boolean;
    };
  },

  async reviewRefundRequest(
    refundId: string,
    input: ReviewRefundRequestInput,
  ): Promise<ApiResponse<Refund>> {
    const response = await http.patch(
      `/refunds/${refundId}/review`,
      input,
    );

    return response.data;
  },

  async processRefund(
    refundId: string,
    input: ProcessRefundInput,
  ): Promise<ApiResponse<ProcessRefundResult>> {
    const response = await http.patch(
      `/refunds/${refundId}/process`,
      input,
    );

    return response.data;
  },
});

export type RefundService = ReturnType<typeof createRefundService>;