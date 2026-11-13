import mongoose from 'mongoose';

import {
  Payment,
  PaymentStatus,
} from '../models/Payment.model';

import {
  Refund,
  RefundStatus,
} from '../models/Refund.model';

import {
  PaymentAudit,
  PaymentAuditAction,
} from '../models/PaymentAudit.model';

import { Invoice } from '../models/Invoice.model';
import { UserRole } from '../constants/roles.enum';

export interface RefundActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export interface CreateRefundRequestInput {
  paymentId: string;
  refundAmount: number;
  reason: string;
  idempotencyKey?: string;
}

const fail = (message: string, statusCode = 400): never => {
  const error = new Error(message) as Error & {
    statusCode: number;
  };

  error.statusCode = statusCode;
  throw error;
};

const toMinorUnits = (amount: number): number => {
  return Math.round(amount * 100);
};

const fromMinorUnits = (amount: number): number => {
  return amount / 100;
};

const validateActor = (actor: RefundActor): void => {
  if (!mongoose.isValidObjectId(actor.userId)) {
    return fail('Invalid authenticated user.', 401);
  }

  const allowedRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.RECEPTION,
  ];

  if (!allowedRoles.includes(actor.role)) {
    return fail('You are not authorized to request refunds.', 403);
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    (!actor.branchId || !mongoose.isValidObjectId(actor.branchId))
  ) {
    return fail('A valid assigned branch is required.', 403);
  }
};

/**
 * Return an existing request when the same idempotency key is reused.
 */
const getExistingRefundRequest = async (
  idempotencyKey: string,
  input: CreateRefundRequestInput,
  actor: RefundActor,
) => {
  const existing = await Refund.findOne({ idempotencyKey });

  if (!existing) {
    return null;
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    String(existing.branchId) !== actor.branchId
  ) {
    return fail(
      'You are not authorized to access this refund request.',
      403,
    );
  }

  if (
    String(existing.paymentId) !== input.paymentId ||
    toMinorUnits(existing.refundAmount) !==
      toMinorUnits(input.refundAmount) ||
    existing.reason !== input.reason
  ) {
    return fail(
      'This idempotency key has already been used for a different refund request.',
      409,
    );
  }

  return {
  refund: existing,
  remainingRefundable: 0,
  alreadyProcessed: true,
};
};

/**
 * Create a refund request.
 *
 * The requested amount is reserved against the payment's
 * refundable balance while the request is pending or approved.
 *
 * No actual money transfer happens in this function.
 */
export const createRefundRequest = async (
  input: CreateRefundRequestInput,
  actor: RefundActor,
) => {
  validateActor(actor);

  if (!mongoose.isValidObjectId(input.paymentId)) {
    return fail('Invalid payment ID.', 400);
  }

  if (
    !Number.isFinite(input.refundAmount) ||
    input.refundAmount <= 0 ||
    Math.abs(
      input.refundAmount * 100 -
        Math.round(input.refundAmount * 100),
    ) > 0.000001
  ) {
    return fail(
      'Refund amount must be positive with at most two decimal places.',
      400,
    );
  }

  const amountInPaise = toMinorUnits(input.refundAmount);
  const refundAmount = fromMinorUnits(amountInPaise);

  const reason = input.reason?.trim();

  if (!reason) {
    return fail('Refund reason is required.', 400);
  }

  if (reason.length > 500) {
    return fail('Refund reason cannot exceed 500 characters.', 400);
  }

  const idempotencyKey =
    input.idempotencyKey?.trim() || undefined;

  if (idempotencyKey && idempotencyKey.length > 150) {
    return fail(
      'Idempotency key cannot exceed 150 characters.',
      400,
    );
  }

  const normalizedInput: CreateRefundRequestInput = {
    ...input,
    refundAmount,
    reason,
    idempotencyKey,
  };

  // Check whether this request was already submitted.
  if (idempotencyKey) {
    const existing = await getExistingRefundRequest(
      idempotencyKey,
      normalizedInput,
      actor,
    );

    if (existing) {
      return existing;
    }
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      /*
       * Lock the payment by updating its timestamp.
       * Concurrent refund requests against the same payment
       * will conflict and retry through the transaction.
       */
      const payment = await Payment.findOneAndUpdate(
        {
          _id: input.paymentId,
          status: {
            $in: [
              PaymentStatus.SUCCESS,
              PaymentStatus.PARTIALLY_REFUNDED,
            ],
          },
        },
        {
          $set: {
            updatedAt: new Date(),
          },
        },
        {
          new: true,
          session,
          timestamps: false,
        },
      );

      if (!payment) {
        const existingPayment = await Payment.findById(
          input.paymentId,
        ).session(session);

        if (!existingPayment) {
          return fail('Payment not found.', 404);
        }

        return fail(
          'Refund can only be requested for a successful or partially refunded payment.',
          409,
        );
      }

      // Branch access control.
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        String(payment.branchId) !== actor.branchId
      ) {
        return fail(
          'You can request refunds for your assigned branch only.',
          403,
        );
      }

      // Find the original invoice, if available.
      const invoice = await Invoice.findOne({
        paymentId: payment._id,
      }).session(session);

      /*
       * Include PENDING, APPROVED and PROCESSED refunds.
       * Pending and approved amounts are reserved so that
       * multiple requests cannot exceed the refundable balance.
       */
      const existingRefunds = await Refund.find({
        paymentId: payment._id,
        status: {
          $in: [
            RefundStatus.PENDING,
            RefundStatus.APPROVED,
            RefundStatus.PROCESSED,
          ],
        },
      })
        .select('refundAmount')
        .session(session);

      const reservedRefundPaise = existingRefunds.reduce(
        (sum, refund) =>
          sum + toMinorUnits(refund.refundAmount),
        0,
      );

      const originalPaymentPaise = toMinorUnits(payment.amount);

      const remainingRefundablePaise =
        originalPaymentPaise - reservedRefundPaise;

      if (remainingRefundablePaise <= 0) {
        return fail(
          'No refundable balance is available for this payment.',
          409,
        );
      }

      if (amountInPaise > remainingRefundablePaise) {
        return fail(
          `Refund exceeds the available refundable balance of ₹${fromMinorUnits(
            remainingRefundablePaise,
          ).toFixed(2)}.`,
          400,
        );
      }

      // Create the refund request.
      const [refund] = await Refund.create(
        [
          {
            ...(idempotencyKey ? { idempotencyKey } : {}),
            paymentId: payment._id,
            invoiceId: invoice?._id ?? null,
            memberId: payment.memberId,
            branchId: payment.branchId,
            refundAmount,
            reason,
            status: RefundStatus.PENDING,
            requestedBy: new mongoose.Types.ObjectId(
              actor.userId,
            ),
            requestedAt: new Date(),
          },
        ],
        { session },
      );

// Record refund request in the payment audit trail.
await PaymentAudit.create(
  [
    {
      paymentId: payment._id,
      refundId: refund._id,
      memberId: payment.memberId,
      branchId: payment.branchId,
      action: PaymentAuditAction.REFUND_REQUESTED,
      performedBy: new mongoose.Types.ObjectId(actor.userId),
      previousStatus: payment.status,
      newStatus: RefundStatus.PENDING,
      amount: refund.refundAmount,
      notes: refund.reason,
      metadata: {
        refundReference: refund.refundReference,
        invoiceId: refund.invoiceId || null,
      },
    },
  ],
  { session },
);


      return {
        refundId: refund._id,
        remainingRefundable: fromMinorUnits(
          remainingRefundablePaise - amountInPaise,
        ),
      };
    });

    if (!result) {
      return fail('Refund request could not be created.', 500);
    }

    const refund = await Refund.findById(result.refundId);

    return {
      refund,
      remainingRefundable: result.remainingRefundable,
      alreadyProcessed: false,
    };
  } catch (error) {
    // Handle concurrent requests using the same idempotency key.
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000 && idempotencyKey) {
      const existing = await getExistingRefundRequest(
        idempotencyKey,
        normalizedInput,
        actor,
      );

      if (existing) {
        return existing;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
};


export type RefundReviewDecision = 'APPROVE' | 'REJECT';

export interface ReviewRefundRequestInput {
  refundId: string;
  decision: RefundReviewDecision;
  approvalNote?: string;
}

export const reviewRefundRequest = async (
  input: ReviewRefundRequestInput,
  actor: RefundActor,
) => {
  validateActor(actor);

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    actor.role !== UserRole.BRANCH_ADMIN
  ) {
    return fail('Only Super Admin or Branch Admin can review refund requests.', 403);
  }

  if (!mongoose.isValidObjectId(input.refundId)) {
    return fail('Invalid refund ID.');
  }

  if (!['APPROVE', 'REJECT'].includes(input.decision)) {
    return fail('Invalid refund decision.');
  }

  const approvalNote = input.approvalNote?.trim();

  if (approvalNote && approvalNote.length > 500) {
    return fail('Approval note cannot exceed 500 characters.');
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const refund = await Refund.findOneAndUpdate(
        {
          _id: input.refundId,
          status: RefundStatus.PENDING,
        },
        { $set: { updatedAt: new Date() } },
        {
          new: true,
          session,
          timestamps: false,
        },
      );

      if (!refund) {
        const existing = await Refund.findById(input.refundId).session(session);

        if (!existing) {
          return fail('Refund request not found.', 404);
        }

        return fail(
          `Refund request cannot be reviewed because its current status is ${existing.status}.`,
          409,
        );
      }

      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        String(refund.branchId) !== actor.branchId
      ) {
        return fail('You are not authorized to review this refund request.', 403);
      }

      const now = new Date();

      if (input.decision === 'APPROVE') {
        refund.status = RefundStatus.APPROVED;
        refund.approvedBy = new mongoose.Types.ObjectId(actor.userId);
        refund.approvedAt = now;
      } else {
        refund.status = RefundStatus.REJECTED;
        refund.rejectedBy = new mongoose.Types.ObjectId(actor.userId);
        refund.rejectedAt = now;
      }

      refund.approvalNote = approvalNote || undefined;

     await refund.save({ session });

// Record refund approval/rejection in audit trail.
const refundAudit = new PaymentAudit({
  paymentId: refund.paymentId,
  refundId: refund._id,
  memberId: refund.memberId,
  branchId: refund.branchId,
  action:
    input.decision === 'APPROVE'
      ? PaymentAuditAction.REFUND_APPROVED
      : PaymentAuditAction.REFUND_REJECTED,
  performedBy: new mongoose.Types.ObjectId(actor.userId),
  previousStatus: RefundStatus.PENDING,
  newStatus: refund.status,
  amount: refund.refundAmount,
  notes: approvalNote || (
    input.decision === 'APPROVE'
      ? 'Refund request approved.'
      : 'Refund request rejected.'
  ),
  metadata: {
    refundReference: refund.refundReference,
    decision: input.decision,
  },
});

await refundAudit.save({ session });

return refund;
    });

    return result;
  } finally {
    await session.endSession();
  }
};


export interface ProcessRefundInput {
  refundId: string;
  refundTransactionId: string;
}

export const processRefund = async (
  input: ProcessRefundInput,
  actor: RefundActor,
) => {
  validateActor(actor);

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    actor.role !== UserRole.BRANCH_ADMIN
  ) {
    return fail('Only Super Admin or Branch Admin can process refunds.', 403);
  }

  if (!mongoose.isValidObjectId(input.refundId)) {
    return fail('Invalid refund ID.');
  }

  const refundTransactionId = input.refundTransactionId?.trim();

  if (!refundTransactionId) {
    return fail('Refund transaction reference is required.');
  }

  if (refundTransactionId.length > 150) {
    return fail('Refund transaction reference cannot exceed 150 characters.');
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const existingRefund = await Refund.findById(input.refundId).session(session);

      if (!existingRefund) {
        return fail('Refund request not found.', 404);
      }

      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        String(existingRefund.branchId) !== actor.branchId
      ) {
        return fail('You are not authorized to process this refund.', 403);
      }

      // Idempotent response for an already processed refund.
      if (existingRefund.status === RefundStatus.PROCESSED) {
        if (existingRefund.refundTransactionId !== refundTransactionId) {
          return fail(
            'This refund has already been processed with another transaction reference.',
            409,
          );
        }

        return {
          refund: existingRefund,
          alreadyProcessed: true,
        };
      }

      if (existingRefund.status !== RefundStatus.APPROVED) {
        return fail('Only approved refund requests can be processed.', 409);
      }

      // Lock the payment so concurrent refund processing is serialized.
      const payment = await Payment.findOneAndUpdate(
        { _id: existingRefund.paymentId },
        { $set: { updatedAt: new Date() } },
        {
          new: true,
          session,
          timestamps: false,
        },
      );

      if (!payment) {
        return fail('Original payment not found.', 404);
      }

      if (
        payment.status !== PaymentStatus.SUCCESS &&
        payment.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        return fail('Original payment is not eligible for refund processing.', 409);
      }

      // Lock the approved refund before processing it.
      const refund = await Refund.findOneAndUpdate(
        {
          _id: input.refundId,
          status: RefundStatus.APPROVED,
        },
        { $set: { updatedAt: new Date() } },
        {
          new: true,
          session,
          timestamps: false,
        },
      );

      if (!refund) {
        return fail('Refund request status changed. Please refresh and try again.', 409);
      }

      refund.status = RefundStatus.PROCESSED;
      refund.refundTransactionId = refundTransactionId;
      refund.processedAt = new Date();

      await refund.save({ session });


const refundAudit = new PaymentAudit({
  paymentId: payment._id,
  refundId: refund._id,
  memberId: refund.memberId,
  branchId: refund.branchId,
  action: PaymentAuditAction.REFUND_PROCESSED,
  performedBy: new mongoose.Types.ObjectId(actor.userId),
  previousStatus: RefundStatus.APPROVED,
  newStatus: RefundStatus.PROCESSED,
  amount: refund.refundAmount,
  notes: 'Refund processed successfully.',
  metadata: {
    refundReference: refund.refundReference,
    refundTransactionId: refund.refundTransactionId,
    paymentMethod: payment.paymentMethod,
  },
});

await refundAudit.save({ session });


      // Calculate all successfully processed refunds for this payment.
      const processedRefunds = await Refund.find({
        paymentId: payment._id,
        status: RefundStatus.PROCESSED,
      })
        .select('refundAmount')
        .session(session);

      const totalRefundedPaise = processedRefunds.reduce(
        (total, item) => total + toMinorUnits(item.refundAmount),
        0,
      );

      const paidPaise = toMinorUnits(payment.amount);

      if (totalRefundedPaise > paidPaise) {
        return fail('Total processed refunds cannot exceed the original payment.', 409);
      }

      payment.status =
        totalRefundedPaise >= paidPaise
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      await payment.save({ session });

      return {
        refund,
        payment,
        totalRefunded: fromMinorUnits(totalRefundedPaise),
        remainingRefundable: fromMinorUnits(paidPaise - totalRefundedPaise),
        alreadyProcessed: false,
      };
    });

    return result;
  } catch (error) {
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000) {
      return fail(
        'This refund transaction reference has already been used.',
        409,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};
