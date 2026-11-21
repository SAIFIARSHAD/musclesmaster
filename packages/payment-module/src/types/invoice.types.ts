export type InvoiceStatus = 'GENERATED' | 'CANCELLED';

export interface InvoiceTaxInfo {
  taxType: string;
  taxRate: number;
  taxAmount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  paymentId: string;
  memberId: string;
  branchId: string;
  subtotal: number;
  discountAmount: number;
  taxInfo: InvoiceTaxInfo[];
  totalTax: number;
  totalAmount: number;
  currency: string;
  billingName: string;
  billingEmail?: string;
  billingPhone: string;
  billingAddress?: string;
  branchName: string;
  branchAddress?: string;
  branchGstNumber?: string;
  pdfUrl?: string | null;
  status: InvoiceStatus;
  generatedDate: string;
  createdAt: string;
  updatedAt: string;
}