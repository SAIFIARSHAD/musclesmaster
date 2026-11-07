import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles.enum';
import { renewMembership } from '../services/membershipRenewal.service';

import {
  assignMembership,
  getMemberships,
  getMembershipById,
  type MembershipActor,
  type MembershipListOptions,
  type AssignMembershipInput,
} from '../services/membership.service';

import {
  requestMembershipFreeze,
  getMembershipFreezeRequests,
  reviewMembershipFreezeRequest,
  unfreezeMembership,
} from '../services/membershipFreeze.service';
import { FreezeRequestStatus } from '../models/MembershipFreezeRequest.model';


const getErrorStatus = (error: unknown, fallback = 500): number => {
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

const getActor = (req: AuthRequest): MembershipActor | null => {
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
 * POST /api/memberships
 * Assign a membership to a member.
 */
export const assignMembershipHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const input: AssignMembershipInput = {
      memberId: req.body.memberId,
      planId: req.body.planId,
      startDate: req.body.startDate,
      notes: req.body.notes,
    };

    const result = await assignMembership(input, actor);

    return res.status(201).json({
      success: true,
      message: 'Membership assigned successfully. Payment is pending.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Assign membership error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to assign membership.',
      ),
    });
  }
};

/**
 * GET /api/memberships
 * Get memberships with filters and pagination.
 */
export const getMembershipsHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const options: MembershipListOptions = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status:
        typeof req.query.status === 'string'
          ? req.query.status
          : undefined,
      memberId:
        typeof req.query.memberId === 'string'
          ? req.query.memberId
          : undefined,
      planId:
        typeof req.query.planId === 'string'
          ? req.query.planId
          : undefined,
      branchId:
        typeof req.query.branchId === 'string'
          ? req.query.branchId
          : undefined,
    };

    const result = await getMemberships(options, actor);

    return res.status(200).json({
      success: true,
      message: 'Memberships fetched successfully.',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    console.error('Get memberships error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch memberships.',
      ),
    });
  }
};

/**
 * GET /api/memberships/:membershipId
 * Get membership details and history.
 */
export const getMembershipByIdHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const membershipId = req.params.membershipId;

    if (typeof membershipId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid membership ID.',
      });
    }

    const result = await getMembershipById(membershipId, actor);

    return res.status(200).json({
      success: true,
      message: 'Membership details fetched successfully.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Get membership details error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch membership details.',
      ),
    });
  }
};

export const renewMembershipHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    // Validate authenticated actor
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const membership = await renewMembership(
      {
        membershipId: String(req.params.membershipId),
        planId: req.body.planId,
        notes: req.body.notes,
      },
      actor,
    );

    return res.status(201).json({
      success: true,
      message:
        'Membership renewal initiated. Awaiting payment confirmation.',
      data: membership,
    });
  } catch (error: unknown) {
  console.error('Membership operation error:', error);

  return res.status(getErrorStatus(error, 500)).json({
    success: false,
    message: getErrorMessage(error, 'Something went wrong.'),
  });
}
};

// Member submits a freeze request.
export const requestMembershipFreezeHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const request = await requestMembershipFreeze(
      {
        membershipId: String(req.params.membershipId),
        requestedDays: Number(req.body.requestedDays),
        reason: req.body.reason,
      },
      actor,
    );

    return res.status(201).json({
      success: true,
      message: 'Freeze request submitted successfully.',
      data: request,
    });
  } catch (error: unknown) {
  console.error('Membership operation error:', error);

  return res.status(getErrorStatus(error, 500)).json({
    success: false,
    message: getErrorMessage(error, 'Something went wrong.'),
  });
}
};

// Staff views freeze requests.
export const getMembershipFreezeRequestsHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const status = req.query.status
      ? (String(req.query.status) as FreezeRequestStatus)
      : undefined;

    const result = await getMembershipFreezeRequests(actor, {
      status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });

    return res.status(200).json({
      success: true,
      message: 'Freeze requests fetched successfully.',
      ...result,
    });
  } catch (error: unknown) {
  console.error('Membership operation error:', error);

  return res.status(getErrorStatus(error, 500)).json({
    success: false,
    message: getErrorMessage(error, 'Something went wrong.'),
  });
}
};

// Staff approves or rejects a freeze request.
export const reviewMembershipFreezeRequestHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const request = await reviewMembershipFreezeRequest(
      {
        requestId: String(req.params.requestId),
        decision: req.body.decision as 'APPROVE' | 'REJECT',
        reviewNotes: req.body.reviewNotes,
      },
      actor,
    );

    return res.status(200).json({
      success: true,
      message: 'Freeze request reviewed successfully.',
      data: request,
    });
  } catch (error: unknown) {
  console.error('Membership operation error:', error);

  return res.status(getErrorStatus(error, 500)).json({
    success: false,
    message: getErrorMessage(error, 'Something went wrong.'),
  });
}
};

// Staff manually unfreezes a membership.
export const unfreezeMembershipHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const membership = await unfreezeMembership(
      String(req.params.membershipId),
      actor,
    );

    return res.status(200).json({
      success: true,
      message: 'Membership unfrozen successfully.',
      data: membership,
    });
  } catch (error: unknown) {
  console.error('Membership operation error:', error);

  return res.status(getErrorStatus(error, 500)).json({
    success: false,
    message: getErrorMessage(error, 'Something went wrong.'),
  });
}
};