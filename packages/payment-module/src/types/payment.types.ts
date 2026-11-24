import type { Invoice } from './invoice.types';
export type PaymentType =
  | 'MEMBERSHIP'
  | 'PERSONAL_TRAINING'
  | 'PRODUCT'
  | 'SERVICE';
export type PaymentMethod =
  | 'CASH'
  | 'UPI'
  | 'CARD'
  | 'NET_BANKING';
export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';
export interface Payment {
  _id: string;
  paymentReference: string;
  memberId: string;
  branchId: string;
  membershipId?: string | null;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  notes?: string;
  createdBy: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateMembershipPaymentInput {
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  idempotencyKey?: string;
}
export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  memberId?: string;
  membershipId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  fromDate?: string;
  toDate?: string;
}
export interface PaymentPagination {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
export interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: PaymentPagination;
}
export interface MembershipPaymentItem {
  _id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string | null;
}
export interface ProcessedRefundSummary {
  refundAmount: number;
  paymentId: string;
}
export interface MembershipPaymentSummary {
  membershipId: string;
  memberId: string;
  branchId: string;
  membershipStatus: string;
  agreedAmount: number;
  totalCollected: number;
  totalRefunded: number;
  netCollected: number;
  remainingDue: number;
  isFullyPaid: boolean;
  payments: MembershipPaymentItem[];
  processedRefunds: ProcessedRefundSummary[];
}
export interface CreateMembershipPaymentResult {
  payment: Payment;
  invoice: Invoice | null;
  membershipActivated: boolean;
  totalCollected: number;
  remainingDue: number;
  alreadyProcessed: boolean;
}
export interface PaymentDashboardSummary {
  dateRange: {
    fromDate: string;
    toDate: string;
    timeZone: string;
  };

  collection: {
    totalCollected: number;
    totalRefunded: number;
    netCollection: number;
    totalTransactions: number;
    todayCollection: number;
    todayTransactions: number;
  };

  dues: {
    totalPendingDue: number;
    pendingMemberships: number;
  };

  refunds: {
    pendingRequests: number;
    pendingAmount: number;
    approvedRequests: number;
    approvedAmount: number;
    processedAmount: number;
  };

  paymentMethods: {
    method: string;
    amount: number;
    count: number;
  }[];

  recentTransactions: Payment[];
}
export interface PaymentDashboardFilters {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
}
export interface OutstandingDuesMember {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  status: string;
  startDate?: string;
  endDate?: string;
}
export interface OutstandingDue {
  _id: string;
  membershipId: string;
  branchId: string;
  membershipStatus: string;
  agreedAmount: number;
  totalCollected: number;
  totalRefunded: number;
  netCollected: number;
  remainingDue: number;
  createdAt: string;
  member: OutstandingDuesMember;
}
export interface OutstandingDuesFilters {
  page?: number;
  limit?: number;
  branchId?: string;
}
export interface OutstandingDuesResponse {
  dues: OutstandingDue[];
  pagination: PaymentPagination;
}
