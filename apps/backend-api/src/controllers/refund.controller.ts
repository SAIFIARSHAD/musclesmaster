import { Response } from 'express';

import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles.enum';

import {
  createRefundRequest,
  reviewRefundRequest,
  processRefund,
  RefundActor,
  CreateRefundRequestInput,
  ReviewRefundRequestInput,
  ProcessRefundInput,
} from '../services/refund.service';

const getErrorStatus = (error: unknown): number => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return 500;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : 'Unable to process refund request.';
};

const getActor = (req: AuthRequest): RefundActor | null => {
  if (!req.user?.userId || !req.user.role) {
    return null;
  }

  return {
    userId: req.user.userId,
    role: req.user.role as UserRole,
    branchId: req.user.branchId,
  };
};

/**
 * Create a refund request.
 *
 * POST /api/refunds
 */
export const createRefundRequestHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const actor = getActor(req);

    if (!actor) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User information missing.',
      });
      return;
    }

    const input: CreateRefundRequestInput = {
      paymentId: req.body.paymentId,
      refundAmount: Number(req.body.refundAmount),
      reason: req.body.reason,
      idempotencyKey: req.body.idempotencyKey,
    };

    const result = await createRefundRequest(input, actor);

    res.status(result.alreadyProcessed ? 200 : 201).json({
      success: true,
      message: result.alreadyProcessed
        ? 'Refund request already exists.'
        : 'Refund request created successfully.',
      data: result.refund,
      remainingRefundable: result.remainingRefundable,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};


export const reviewRefundRequestHandler = async (
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

    const refundId = Array.isArray(req.params.refundId)
      ? req.params.refundId[0]
      : req.params.refundId;

    const input: ReviewRefundRequestInput = {
      refundId,
      decision: req.body.decision,
      approvalNote: req.body.approvalNote,
    };

    const refund = await reviewRefundRequest(input, actor);

    res.status(200).json({
      success: true,
      message:
        input.decision === 'APPROVE'
          ? 'Refund request approved successfully.'
          : 'Refund request rejected successfully.',
      data: refund,
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};



export const processRefundHandler = async (
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

    const refundId = Array.isArray(req.params.refundId)
      ? req.params.refundId[0]
      : req.params.refundId;

    const input: ProcessRefundInput = {
      refundId,
      refundTransactionId: req.body.refundTransactionId,
    };

    const result = await processRefund(input, actor);

    res.status(result.alreadyProcessed ? 200 : 200).json({
      success: true,
      message: result.alreadyProcessed
        ? 'Refund was already processed.'
        : 'Refund processed successfully.',
      data: result,
    });
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};
