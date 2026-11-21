import mongoose from 'mongoose';

import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  IPayment,
} from '../models/Payment.model';

import {
  PaymentAudit,
  PaymentAuditAction,
} from '../models/PaymentAudit.model';



import { Invoice, InvoiceStatus } from '../models/Invoice.model';
import { Refund, RefundStatus } from '../models/Refund.model';
import { Membership, MembershipStatus } from '../models/Membership.model';
import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../models/MembershipHistory.model';
import { Member } from '../models/Member.model';
import { Branch } from '../models/Branch.model';
import { UserRole } from '../constants/roles.enum';
import { generateInvoiceNumber } from '../utils/invoiceNumberGenerator';

export interface PaymentActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export interface CreateMembershipPaymentInput {
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  idempotencyKey?: string;
}

const fail = (message: string, statusCode = 400): never => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  throw error;
};

const toMinorUnits = (amount: number): number => {
  return Math.round(amount * 100);
};

const fromMinorUnits = (amount: number): number => {
  return amount / 100;
};

const optionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const validateActor = (actor: PaymentActor): void => {
  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('Invalid authenticated user.', 401);
  }

  const allowedRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ];

  if (!allowedRoles.includes(actor.role)) {
    return fail('You are not authorized to collect payments.', 403);
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    (!actor.branchId || !mongoose.isValidObjectId(actor.branchId))
  ) {
    return fail('A valid assigned branch is required.', 403);
  }
};

const getExistingIdempotentPayment = async (
  idempotencyKey: string,
  input: CreateMembershipPaymentInput,
  actor: PaymentActor,
) => {
  const existing = await Payment.findOne({ idempotencyKey });

  if (!existing) return null;

  // Verify branch access.
  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    String(existing.branchId) !== actor.branchId
  ) {
    return fail(
      'You are not authorized to access this payment.',
      403,
    );
  }

  // Verify that the same key is not reused for another payment.
  if (
    String(existing.membershipId) !== input.membershipId ||
    toMinorUnits(existing.amount) !== toMinorUnits(input.amount) ||
    existing.paymentMethod !== input.paymentMethod
  ) {
    return fail(
      'This idempotency key has already been used for a different payment.',
      409,
    );
  }

  const [invoice, membership] = await Promise.all([
    Invoice.findOne({ paymentId: existing._id }),
    Membership.findById(existing.membershipId).select('status'),
  ]);

  return {
    payment: existing,
    invoice,
    membershipActivated:
      membership?.status === MembershipStatus.ACTIVE,
    alreadyProcessed: true,
  };
};

/**
 * Collect a membership payment.
 *
 * Each collection creates:
 * 1. One successful Payment record.
 * 2. One separate Invoice.
 *
 * Membership activates only after the complete payable amount
 * has been collected, net of processed refunds.
 */
export const createMembershipPayment = async (
  input: CreateMembershipPaymentInput,
  actor: PaymentActor,
) => {
  validateActor(actor);

  if (!mongoose.isValidObjectId(input.membershipId)) {
    return fail('Invalid membership ID.', 400);
  }

  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 0.000001
  ) {
    return fail('Payment amount must be a positive amount with at most two decimal places.', 400);
  }

  if (!Object.values(PaymentMethod).includes(input.paymentMethod)) {
    return fail('Invalid payment method.', 400);
  }

  const amountInPaise = toMinorUnits(input.amount);
  const amount = fromMinorUnits(amountInPaise);

  const idempotencyKey = input.idempotencyKey?.trim() || undefined;

  if (idempotencyKey && idempotencyKey.length > 150) {
    return fail('Idempotency key cannot exceed 150 characters.', 400);
  }

  const transactionId = input.transactionId?.trim() || undefined;
  const notes = input.notes?.trim() || undefined;


  // Return an earlier result if this request was already processed.
  if (idempotencyKey) {
    const existing = await getExistingIdempotentPayment(
      idempotencyKey,
      {
        ...input,
        amount,
      },
      actor,
    );

    if (existing) return existing;
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      // Fetch and lock the pending membership inside the transaction.
      const membership = await Membership.findOneAndUpdate(
        {
          _id: input.membershipId,
          status: MembershipStatus.PENDING,
        },
        {
          $set: { updatedAt: new Date() },
        },
        {
          new: true,
          session,
          timestamps: false,
        },
      );

      if (!membership) {
        const existingMembership = await Membership.findById(
          input.membershipId,
        ).session(session);

        if (!existingMembership) {
          return fail('Membership not found.', 404);
        }

        return fail(
          'Payment can only be collected for a pending membership.',
          409,
        );
      }

      const branchId = String(membership.branchId);

      // Branch access control.
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        actor.branchId !== branchId
      ) {
        return fail(
          'You can collect payments from your assigned branch only.',
          403,
        );
      }

      const [member, branch] = await Promise.all([
        Member.findById(membership.memberId).session(session),
        Branch.findById(membership.branchId).session(session),
      ]);

      if (!member) return fail('Member not found.', 404);

      if (!branch || !branch.isActive) {
        return fail('Member branch is not active.', 400);
      }

      if (!branch.code?.trim()) {
        return fail('Branch code is required for invoice generation.', 400);
      }

      const billingName = [
        member.firstName,
        member.lastName,
      ].filter(Boolean).join(' ').trim();

      const billingPhone = optionalString(member.mobile);

      if (!billingName || !billingPhone) {
        return fail(
          'Member billing name and mobile number are required to generate an invoice.',
          400,
        );
      }

      // Get all captured payments for this membership.
      // Refunded payments remain captured historical payments.
      const capturedPayments = await Payment.find({
        membershipId: membership._id,
        status: {
          $in: [
            PaymentStatus.SUCCESS,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUNDED,
          ],
        },
      })
        .select('_id amount')
        .session(session);

      const paymentIds = capturedPayments.map((payment) => payment._id);

      // Only processed refunds reduce net collections.
      const processedRefunds = paymentIds.length
        ? await Refund.find({
            paymentId: { $in: paymentIds },
            status: RefundStatus.PROCESSED,
          })
            .select('refundAmount')
            .session(session)
        : [];

      const totalCapturedPaise = capturedPayments.reduce(
        (sum, payment) => sum + toMinorUnits(payment.amount),
        0,
      );

      const totalRefundedPaise = processedRefunds.reduce(
        (sum, refund) => sum + toMinorUnits(refund.refundAmount),
        0,
      );

      const netCollectedPaise = totalCapturedPaise - totalRefundedPaise;
      const agreedAmountPaise = toMinorUnits(membership.agreedAmount);
      const duePaise = agreedAmountPaise - netCollectedPaise;

      if (duePaise <= 0) {
        return fail('This membership has already been fully paid.', 409);
      }

      if (amountInPaise > duePaise) {
        return fail(
          `Payment exceeds the remaining due of ₹${fromMinorUnits(duePaise).toFixed(2)}.`,
          400,
        );
      }

      // Create this individual collection as a successful payment.
      const [payment] = await Payment.create(
        [
          {
            ...(idempotencyKey ? { idempotencyKey } : {}),
            memberId: member._id,
            branchId: branch._id,
            membershipId: membership._id,
            paymentType: PaymentType.MEMBERSHIP,
            paymentMethod: input.paymentMethod,
            status: PaymentStatus.SUCCESS,
            amount,
            currency: 'INR',
            ...(transactionId ? { transactionId } : {}),
            ...(notes ? { notes } : {}),
            createdBy: new mongoose.Types.ObjectId(actor.userId),
            paidAt: new Date(),
          },
        ],
        { session },
      );

// Record payment creation in the audit trail.
const paymentAudit = new PaymentAudit({
  paymentId: payment._id,
  memberId: member._id,
  branchId: branch._id,
  action: PaymentAuditAction.PAYMENT_CREATED,
  performedBy: new mongoose.Types.ObjectId(actor.userId),
  newStatus: PaymentStatus.SUCCESS,
  amount,
  notes: notes || 'Membership payment collected.',
  metadata: {
    membershipId: membership._id,
    paymentMethod: input.paymentMethod,
    transactionId: transactionId || null,
  },
});

await paymentAudit.save({ session });



      // Generate a separate invoice for this collection.
      // The counter is maintained separately; a failed transaction
      // may leave a harmless invoice-number gap.
      const invoiceNumber = await generateInvoiceNumber(branch.code);

      // GST is intentionally not calculated here because no
      // tax configuration has been provided yet.
      const [invoice] = await Invoice.create(
        [
          {
            invoiceNumber,
            paymentId: payment._id,
            memberId: member._id,
            branchId: branch._id,
            subtotal: amount,
            discountAmount: 0,
            taxInfo: [],
            totalTax: 0,
            totalAmount: amount,
            currency: 'INR',
            billingName,
            ...(optionalString(member.email)
              ? { billingEmail: optionalString(member.email) }
              : {}),
            billingPhone,
            ...(optionalString(member.address)
              ? { billingAddress: optionalString(member.address) }
              : {}),
            branchName: branch.name,
            ...(optionalString(branch.address)
              ? { branchAddress: optionalString(branch.address) }
              : {}),
            ...(optionalString(branch.gstNumber)
              ? { branchGstNumber: optionalString(branch.gstNumber) }
              : {}),
            status: InvoiceStatus.GENERATED,
            generatedDate: new Date(),
          },
        ],
        { session },
      );

      // Recalculate total collections including the new payment.
      const updatedCapturedPaise = totalCapturedPaise + amountInPaise;
      const updatedNetCollectedPaise =
        updatedCapturedPaise - totalRefundedPaise;

      const membershipActivated =
        updatedNetCollectedPaise >= agreedAmountPaise;

      if (membershipActivated) {
        const activationTime = new Date();

        const activatedMembership = await Membership.findOneAndUpdate(
          {
            _id: membership._id,
            status: MembershipStatus.PENDING,
          },
          {
            $set: {
              status: MembershipStatus.ACTIVE,
              activatedAt: activationTime,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!activatedMembership) {
          return fail(
            'Membership activation failed. Please retry the payment.',
            409,
          );
        }

        await MembershipHistory.create(
          [
            {
              membershipId: membership._id,
              memberId: member._id,
              branchId: branch._id,
              action: MembershipHistoryAction.ACTIVATED,
              previousStatus: MembershipStatus.PENDING,
              newStatus: MembershipStatus.ACTIVE,
              performedBy: new mongoose.Types.ObjectId(actor.userId),
              notes: 'Membership activated after full payment.',
              metadata: {
                agreedAmount: membership.agreedAmount,
                totalCollected: fromMinorUnits(updatedNetCollectedPaise),
                lastPaymentId: payment._id,
              },
            },
          ],
          { session },
        );
      }

      return {
        paymentId: payment._id,
        invoiceId: invoice._id,
        membershipActivated,
        totalCollected: fromMinorUnits(updatedNetCollectedPaise),
        remainingDue: fromMinorUnits(
          Math.max(0, agreedAmountPaise - updatedNetCollectedPaise),
        ),
      };
    });

    if (!result) {
      return fail('Payment could not be completed.', 500);
    }

    const [payment, invoice] = await Promise.all([
      Payment.findById(result.paymentId),
      Invoice.findById(result.invoiceId),
    ]);

    return {
      payment,
      invoice,
      membershipActivated: result.membershipActivated,
      totalCollected: result.totalCollected,
      remainingDue: result.remainingDue,
      alreadyProcessed: false,
    };
    } catch (error) {
    // Handle a duplicate idempotency key safely.
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000 && idempotencyKey) {
      const existing = await getExistingIdempotentPayment(
        idempotencyKey,
        {
          ...input,
          amount,
        },
        actor,
      );

      if (existing) return existing;
    }

    throw error;
  } finally {
    await session.endSession();
  }
};


export interface PaymentHistoryInput {
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

export const getPaymentHistory = async (
  input: PaymentHistoryInput,
  actor: PaymentActor,
) => {
  validateActor(actor);

  const page = Number(input.page ?? 1);
  const limit = Number(input.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    return fail('Page must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail('Limit must be between 1 and 100.');
  }

  const filter: Record<string, unknown> = {};

  // Branch-level access control.
  if (actor.role !== UserRole.SUPER_ADMIN) {
    if (
      input.branchId &&
      input.branchId !== actor.branchId
    ) {
      return fail('You can access your assigned branch only.', 403);
    }

    filter.branchId = new mongoose.Types.ObjectId(actor.branchId);
  } else if (input.branchId) {
    if (!mongoose.isValidObjectId(input.branchId)) {
      return fail('Invalid branch ID.');
    }

    filter.branchId = new mongoose.Types.ObjectId(input.branchId);
  }

  if (input.memberId) {
    if (!mongoose.isValidObjectId(input.memberId)) {
      return fail('Invalid member ID.');
    }

    filter.memberId = new mongoose.Types.ObjectId(input.memberId);
  }

  if (input.membershipId) {
    if (!mongoose.isValidObjectId(input.membershipId)) {
      return fail('Invalid membership ID.');
    }

    filter.membershipId = new mongoose.Types.ObjectId(input.membershipId);
  }

  if (
    input.status &&
    !Object.values(PaymentStatus).includes(input.status)
  ) {
    return fail('Invalid payment status.');
  }

  if (
    input.paymentType &&
    !Object.values(PaymentType).includes(input.paymentType)
  ) {
    return fail('Invalid payment type.');
  }

  if (input.status) {
    filter.status = input.status;
  }

  if (input.paymentType) {
    filter.paymentType = input.paymentType;
  }

  // Date filtering.
  if (input.fromDate || input.toDate) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};

    if (input.fromDate) {
      const fromDate = new Date(input.fromDate);

      if (Number.isNaN(fromDate.getTime())) {
        return fail('Invalid fromDate.');
      }

      dateFilter.$gte = fromDate;
    }

    if (input.toDate) {
      const toDate = new Date(input.toDate);

      if (Number.isNaN(toDate.getTime())) {
        return fail('Invalid toDate.');
      }

      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }

    if (
      dateFilter.$gte &&
      dateFilter.$lte &&
      dateFilter.$gte > dateFilter.$lte
    ) {
      return fail('fromDate cannot be later than toDate.');
    }

    filter.paidAt = dateFilter;
  }

  const skip = (page - 1) * limit;

  const [payments, totalRecords] = await Promise.all([
    Payment.find(filter)
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};


export const getMembershipPaymentSummary = async (
  membershipId: string,
  actor: PaymentActor,
) => {
  validateActor(actor);

  if (!mongoose.isValidObjectId(membershipId)) {
    return fail('Invalid membership ID.');
  }

  const membership = await Membership.findById(membershipId);

  if (!membership) {
    return fail('Membership not found.', 404);
  }

  // Branch-level access control.
  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    String(membership.branchId) !== actor.branchId
  ) {
    return fail(
      'You are not authorized to access this membership payment summary.',
      403,
    );
  }

  const payments = await Payment.find({
    membershipId: membership._id,
    status: {
      $in: [
        PaymentStatus.SUCCESS,
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.REFUNDED,
      ],
    },
  })
    .select('_id amount status paymentMethod paidAt')
    .lean();

  const paymentIds = payments.map((payment) => payment._id);

  const processedRefunds = paymentIds.length
    ? await Refund.find({
        paymentId: { $in: paymentIds },
        status: RefundStatus.PROCESSED,
      })
        .select('refundAmount paymentId')
        .lean()
    : [];

  const totalCollectedPaise = payments.reduce(
    (total, payment) => total + toMinorUnits(payment.amount),
    0,
  );

  const totalRefundedPaise = processedRefunds.reduce(
    (total, refund) => total + toMinorUnits(refund.refundAmount),
    0,
  );

  const netCollectedPaise =
    totalCollectedPaise - totalRefundedPaise;

  const agreedAmountPaise = toMinorUnits(membership.agreedAmount);

  const remainingDuePaise = Math.max(
    0,
    agreedAmountPaise - netCollectedPaise,
  );

  return {
    membershipId: membership._id,
    memberId: membership.memberId,
    branchId: membership.branchId,
    membershipStatus: membership.status,

    agreedAmount: fromMinorUnits(agreedAmountPaise),
    totalCollected: fromMinorUnits(totalCollectedPaise),
    totalRefunded: fromMinorUnits(totalRefundedPaise),
    netCollected: fromMinorUnits(netCollectedPaise),
    remainingDue: fromMinorUnits(remainingDuePaise),

    isFullyPaid: remainingDuePaise === 0,

    payments,
    processedRefunds,
  };
};



export interface PaymentAuditHistoryInput {
  paymentId: string;
  page?: number;
  limit?: number;
  action?: PaymentAuditAction;
}

export const getPaymentAuditHistory = async (
  input: PaymentAuditHistoryInput,
  actor: PaymentActor,
) => {
  validateActor(actor);

  if (!mongoose.isValidObjectId(input.paymentId)) {
    return fail('Invalid payment ID.');
  }

  const page = Number(input.page ?? 1);
  const limit = Number(input.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    return fail('Page must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail('Limit must be between 1 and 100.');
  }

  if (
    input.action &&
    !Object.values(PaymentAuditAction).includes(input.action)
  ) {
    return fail('Invalid audit action.');
  }

  const payment = await Payment.findById(input.paymentId);

  if (!payment) {
    return fail('Payment not found.', 404);
  }

  // Verify branch access before returning audit records.
  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    String(payment.branchId) !== actor.branchId
  ) {
    return fail(
      'You are not authorized to access this payment audit history.',
      403,
    );
  }

  const filter: Record<string, unknown> = {
    paymentId: payment._id,
  };

  if (input.action) {
    filter.action = input.action;
  }

  const skip = (page - 1) * limit;

  const [auditRecords, totalRecords] = await Promise.all([
    PaymentAudit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    PaymentAudit.countDocuments(filter),
  ]);

  return {
    paymentId: payment._id,
    auditRecords,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};


export interface PaymentDashboardInput {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
}

const getISTDateString = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const getISTDateBoundary = (
  date: string,
  endOfDay = false,
): Date => {
  return new Date(
    `${date}T${endOfDay ? '23:59:59.999' : '00:00:00'}+05:30`,
  );
};

export const getPaymentDashboardSummary = async (
  input: PaymentDashboardInput,
  actor: PaymentActor,
) => {
  validateActor(actor);

  const today = getISTDateString();
  const currentMonth = today.slice(0, 7);

  // Default date range: current month.
  const fromDate = input.fromDate || `${currentMonth}-01`;
  const toDate = input.toDate || today;

  if (
    !isValidDateString(fromDate) ||
    !isValidDateString(toDate)
  ) {
    return fail('Invalid dashboard date range.');
  }

  const rangeStart = getISTDateBoundary(fromDate);
  const rangeEnd = getISTDateBoundary(toDate, true);

  if (rangeStart > rangeEnd) {
    return fail('fromDate cannot be later than toDate.');
  }

  const todayStart = getISTDateBoundary(today);
  const todayEnd = getISTDateBoundary(today, true);

  // Apply branch-level access control.
  const branchFilter: Record<string, unknown> = {};

  if (actor.role !== UserRole.SUPER_ADMIN) {
    if (
      input.branchId &&
      input.branchId !== actor.branchId
    ) {
      return fail(
        'You can access your assigned branch only.',
        403,
      );
    }

    branchFilter.branchId = new mongoose.Types.ObjectId(
      actor.branchId,
    );
  } else if (input.branchId) {
    if (!mongoose.isValidObjectId(input.branchId)) {
      return fail('Invalid branch ID.');
    }

    branchFilter.branchId = new mongoose.Types.ObjectId(
      input.branchId,
    );
  }

  const successfulStatuses = [
    PaymentStatus.SUCCESS,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ];

  // Collection metrics use payment paidAt.
  const paymentFilter = {
    ...branchFilter,
    status: { $in: successfulStatuses },
    paidAt: {
      $gte: rangeStart,
      $lte: rangeEnd,
    },
  };

  // Refund metrics use actual processing date.
  const refundFilter = {
    ...branchFilter,
    status: RefundStatus.PROCESSED,
    processedAt: {
      $gte: rangeStart,
      $lte: rangeEnd,
    },
  };

  // Today's collection always uses India local date.
  const todayPaymentFilter = {
    ...branchFilter,
    status: { $in: successfulStatuses },
    paidAt: {
      $gte: todayStart,
      $lte: todayEnd,
    },
  };

  const [
    collectionResult,
    todayResult,
    refundResult,
    refundRequestCounts,
    paymentMethods,
    recentTransactions,
    duesResult,
  ] = await Promise.all([
    // Gross collection.
    Payment.aggregate([
      { $match: paymentFilter },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]),

    // Today's collection.
    Payment.aggregate([
      { $match: todayPaymentFilter },
      {
        $group: {
          _id: null,
          todayCollection: { $sum: '$amount' },
          todayTransactions: { $sum: 1 },
        },
      },
    ]),

    // Successfully processed refunds.
    Refund.aggregate([
      { $match: refundFilter },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundAmount' },
        },
      },
    ]),

    // Current open refund requests.
    Refund.aggregate([
      {
        $match: {
          ...branchFilter,
          status: {
            $in: [
              RefundStatus.PENDING,
              RefundStatus.APPROVED,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$refundAmount' },
        },
      },
    ]),

    // Payment method breakdown.
    Payment.aggregate([
      { $match: paymentFilter },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]),

    // Latest 10 transactions in selected date range.
    Payment.find(paymentFilter)
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),

    // Outstanding dues of pending memberships.
    Membership.aggregate([
      {
        $match: {
          ...branchFilter,
          status: MembershipStatus.PENDING,
        },
      },
      {
        $lookup: {
          from: 'payments',
          let: { membershipId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$membershipId', '$$membershipId'],
                },
                status: { $in: successfulStatuses },
              },
            },
            {
              $lookup: {
                from: 'refunds',
                let: { paymentId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$paymentId', '$$paymentId'],
                      },
                      status: RefundStatus.PROCESSED,
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalRefunded: {
                        $sum: '$refundAmount',
                      },
                    },
                  },
                ],
                as: 'refundSummary',
              },
            },
            {
              $project: {
                netCollected: {
                  $subtract: [
                    '$amount',
                    {
                      $ifNull: [
                        {
                          $arrayElemAt: [
                            '$refundSummary.totalRefunded',
                            0,
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'membershipPayments',
        },
      },
      {
        $project: {
          outstandingDue: {
            $max: [
              0,
              {
                $subtract: [
                  '$agreedAmount',
                  {
                    $sum: '$membershipPayments.netCollected',
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          outstandingDue: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalPendingDue: { $sum: '$outstandingDue' },
          pendingMemberships: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalCollected =
    collectionResult[0]?.totalCollected ?? 0;

  const totalRefunded =
    refundResult[0]?.totalRefunded ?? 0;

  const pendingRequests =
    refundRequestCounts.find(
      (item) => item._id === RefundStatus.PENDING,
    );

  const approvedRequests =
    refundRequestCounts.find(
      (item) => item._id === RefundStatus.APPROVED,
    );

  return {
    dateRange: {
      fromDate,
      toDate,
      timeZone: 'Asia/Kolkata',
    },

    collection: {
      totalCollected,
      totalRefunded,
      netCollection: totalCollected - totalRefunded,
      totalTransactions:
        collectionResult[0]?.totalTransactions ?? 0,
      todayCollection:
        todayResult[0]?.todayCollection ?? 0,
      todayTransactions:
        todayResult[0]?.todayTransactions ?? 0,
    },

    dues: {
      totalPendingDue:
        duesResult[0]?.totalPendingDue ?? 0,
      pendingMemberships:
        duesResult[0]?.pendingMemberships ?? 0,
    },

    refunds: {
      pendingRequests: pendingRequests?.count ?? 0,
      pendingAmount: pendingRequests?.amount ?? 0,
      approvedRequests: approvedRequests?.count ?? 0,
      approvedAmount: approvedRequests?.amount ?? 0,
      processedAmount: totalRefunded,
    },

    paymentMethods: paymentMethods.map((item) => ({
      method: item._id,
      amount: item.amount,
      count: item.count,
    })),

    recentTransactions,
  };
};


export interface OutstandingDuesInput {
  page?: number;
  limit?: number;
  branchId?: string;
}

export const getOutstandingDues = async (
  input: OutstandingDuesInput,
  actor: PaymentActor,
) => {
  validateActor(actor);

  const page = Number(input.page ?? 1);
  const limit = Number(input.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    return fail('Page must be a positive integer.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail('Limit must be between 1 and 100.');
  }

  // Apply branch-level access control.
  const branchFilter: Record<string, unknown> = {
    status: MembershipStatus.PENDING,
  };

  if (actor.role !== UserRole.SUPER_ADMIN) {
    if (
      input.branchId &&
      input.branchId !== actor.branchId
    ) {
      return fail(
        'You can access your assigned branch only.',
        403,
      );
    }

    branchFilter.branchId = new mongoose.Types.ObjectId(
      actor.branchId,
    );
  } else if (input.branchId) {
    if (!mongoose.isValidObjectId(input.branchId)) {
      return fail('Invalid branch ID.');
    }

    branchFilter.branchId = new mongoose.Types.ObjectId(
      input.branchId,
    );
  }

  const successfulStatuses = [
    PaymentStatus.SUCCESS,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ];

  const skip = (page - 1) * limit;

  const result = await Membership.aggregate([
    {
      $match: branchFilter,
    },

    // Fetch successful payments for each membership.
    {
      $lookup: {
        from: 'payments',
        let: { membershipId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$membershipId', '$$membershipId'],
              },
              status: { $in: successfulStatuses },
            },
          },
          {
            $lookup: {
              from: 'refunds',
              let: { paymentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$paymentId', '$$paymentId'],
                    },
                    status: RefundStatus.PROCESSED,
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalRefunded: {
                      $sum: '$refundAmount',
                    },
                  },
                },
              ],
              as: 'refundSummary',
            },
          },
          {
            $addFields: {
              refundedAmount: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      '$refundSummary.totalRefunded',
                      0,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          {
            $project: {
              amount: 1,
              refundedAmount: 1,
              netCollected: {
                $subtract: ['$amount', '$refundedAmount'],
              },
            },
          },
        ],
        as: 'membershipPayments',
      },
    },

    // Calculate membership-wise collection totals.
    {
      $addFields: {
        totalCollected: {
          $sum: '$membershipPayments.amount',
        },
        totalRefunded: {
          $sum: '$membershipPayments.refundedAmount',
        },
        netCollected: {
          $sum: '$membershipPayments.netCollected',
        },
      },
    },

    // Calculate remaining due.
    {
      $addFields: {
        remainingDue: {
          $max: [
            0,
            {
              $subtract: ['$agreedAmount', '$netCollected'],
            },
          ],
        },
      },
    },

    // Only memberships with outstanding dues.
    {
      $match: {
        remainingDue: { $gt: 0 },
      },
    },

    // Fetch member details.
    {
      $lookup: {
        from: 'members',
        localField: 'memberId',
        foreignField: '_id',
        as: 'member',
      },
    },
    {
      $unwind: '$member',
    },

    {
      $project: {
        _id: 1,
        membershipId: '$_id',
        branchId: 1,
        membershipStatus: '$status',
        agreedAmount: 1,
        totalCollected: 1,
        totalRefunded: 1,
        netCollected: 1,
        remainingDue: 1,
        createdAt: 1,

        member: {
          _id: '$member._id',
          memberId: '$member.memberId',
          firstName: '$member.firstName',
          lastName: '$member.lastName',
          mobile: '$member.mobile',
          status: '$member.status',
          startDate: '$member.startDate',
          endDate: '$member.endDate',
        },
      },
    },

    {
      $sort: {
        remainingDue: -1,
        createdAt: -1,
      },
    },

    // Return paginated records and total count.
    {
      $facet: {
        records: [
          { $skip: skip },
          { $limit: limit },
        ],
        metadata: [
          { $count: 'totalRecords' },
        ],
      },
    },
  ]);

  const records = result[0]?.records ?? [];
  const totalRecords = result[0]?.metadata[0]?.totalRecords ?? 0;

  return {
    dues: records,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};
