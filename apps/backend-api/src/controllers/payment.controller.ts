import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles.enum';
import { PaymentMethod } from '../models/Payment.model';
import {
  createMembershipPayment,
  getPaymentHistory,
  getMembershipPaymentSummary,
  PaymentActor,
  CreateMembershipPaymentInput,
  PaymentHistoryInput,
  getPaymentAuditHistory,
  PaymentAuditHistoryInput,
} from '../services/payment.service';

const getErrorStatus = (
  error: unknown,
  fallback: number = 500,
): number => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    return 409;
  }

  return fallback;
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
};

const getActor = (req: AuthRequest): PaymentActor | null => {
  if (!req.user?.userId) {
    return null;
  }

  return {
    userId: req.user.userId,
    role: req.user.role as UserRole,
    branchId: req.user.branchId,
  };
};

/**
 * POST /api/payments/membership
 *
 * Collect a membership payment.
 *
 * Allowed roles:
 * SUPER_ADMIN, BRANCH_ADMIN, RECEPTION
 */
export const createMembershipPaymentHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const input: CreateMembershipPaymentInput = {
      membershipId: req.body.membershipId,
      amount: Number(req.body.amount),
      paymentMethod: req.body.paymentMethod,
      transactionId: req.body.transactionId,
      notes: req.body.notes,
      idempotencyKey: req.body.idempotencyKey,
    };

    const result = await createMembershipPayment(input, actor);

    return res.status(result.alreadyProcessed ? 200 : 201).json({
      success: true,
      message: result.alreadyProcessed
        ? 'This payment was already processed.'
        : 'Membership payment collected successfully.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Create membership payment error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to collect membership payment.',
      ),
    });
  }
};

export const getPaymentHistoryHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const input: PaymentHistoryInput = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      branchId: req.query.branchId as string | undefined,
      memberId: req.query.memberId as string | undefined,
      membershipId: req.query.membershipId as string | undefined,
      status: req.query.status as PaymentHistoryInput['status'],
      paymentType: req.query.paymentType as PaymentHistoryInput['paymentType'],
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
    };

    const result = await getPaymentHistory(input, actor);

    res.status(200).json({
      success: true,
      message: 'Payment history fetched successfully.',
      data: result.payments,
      pagination: result.pagination,
    });
} catch (error) {
  res.status(getErrorStatus(error)).json({
    success: false,
    message: getErrorMessage(
      error,
      'Unable to fetch payment history.',
    ),
  });
}
};

export const getMembershipPaymentSummaryHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const membershipId = Array.isArray(req.params.membershipId)
      ? req.params.membershipId[0]
      : req.params.membershipId;

    const result = await getMembershipPaymentSummary(
      membershipId,
      actor,
    );

    res.status(200).json({
      success: true,
      message: 'Membership payment summary fetched successfully.',
      data: result,
    });
} catch (error) {
  res.status(getErrorStatus(error)).json({
    success: false,
    message: getErrorMessage(
      error,
      'Unable to fetch membership payment summary.',
    ),
  });
}
};

export const getPaymentAuditHistoryHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;

    const input: PaymentAuditHistoryInput = {
      paymentId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      action: req.query.action as PaymentAuditHistoryInput['action'],
    };

    const result = await getPaymentAuditHistory(input, actor);

    res.status(200).json({
      success: true,
      message: 'Payment audit history fetched successfully.',
      data: result.auditRecords,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch payment audit history.',
      ),
    });
  }
};
