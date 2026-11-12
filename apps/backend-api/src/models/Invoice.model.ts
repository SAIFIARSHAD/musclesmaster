
import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  GENERATED = 'GENERATED',
  CANCELLED = 'CANCELLED',
}

export interface IInvoiceTaxInfo {
  taxType: string;
  taxRate: number;
  taxAmount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;

  paymentId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;

  subtotal: number;
  discountAmount: number;
  taxInfo: IInvoiceTaxInfo[];
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
  generatedDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

const invoiceTaxInfoSchema = new Schema<IInvoiceTaxInfo>(
  {
    taxType: {
      type: String,
      required: true,
      trim: true,
    },

    taxRate: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      immutable: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      immutable: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      immutable: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
      immutable: true,
    },

    taxInfo: {
      type: [invoiceTaxInfoSchema],
      default: [],
      immutable: true,
    },

    totalTax: {
      type: Number,
      default: 0,
      min: 0,
      immutable: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
      immutable: true,
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      immutable: true,
    },

    billingName: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    billingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      immutable: true,
    },

    billingPhone: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    billingAddress: {
      type: String,
      trim: true,
      immutable: true,
    },

    branchName: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    branchAddress: {
      type: String,
      trim: true,
      immutable: true,
    },

    branchGstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      immutable: true,
    },

    // PDF can be generated or uploaded after invoice creation.
    pdfUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.GENERATED,
      required: true,
    },

    generatedDate: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

// One invoice per payment.
invoiceSchema.index(
  { paymentId: 1 },
  { unique: true, name: 'unique_payment_invoice' },
);

// Branch-wise invoice history.
invoiceSchema.index({
  branchId: 1,
  generatedDate: -1,
});

// Member-wise invoice history.
invoiceSchema.index({
  memberId: 1,
  generatedDate: -1,
});

export const Invoice = mongoose.model<IInvoice>(
  'Invoice',
  invoiceSchema,
);
