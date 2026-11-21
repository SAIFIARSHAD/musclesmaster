
export type RefundStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSED'
  | 'FAILED';

export type RefundReviewDecision = 'APPROVE' | 'REJECT';

export interface Refund {
  _id: string;
  refundReference: string;
  paymentId: string;
  invoiceId?: string | null;
  memberId: string;
  branchId: string;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  approvalNote?: string;
  refundTransactionId?: string;
  requestedAt: string;
  approvedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundRequestInput {
  paymentId: string;
  refundAmount: number;
  reason: string;
  idempotencyKey?: string;
}

export interface CreateRefundRequestResult {
  refund: Refund;
  remainingRefundable: number;
  alreadyProcessed: boolean;
}

export interface ReviewRefundRequestInput {
  decision: RefundReviewDecision;
  approvalNote?: string;
}

export interface ProcessRefundInput {
  refundTransactionId: string;
}

export interface ProcessRefundResult {
  refund: Refund;
  alreadyProcessed: boolean;
}
