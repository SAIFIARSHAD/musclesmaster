
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createMembershipPlan,
  getMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  deactivateMembershipPlan,
} from '../services/membershipPlan.service';

function getPlanIdParam(
  id: string | string[] | undefined,
): string | null {
  if (typeof id !== 'string' || !id.trim()) {
    return null;
  }

  return id.trim();
}

function statusOf(error: unknown): number {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return 500;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getMembershipPlansHandler(
  req: Request,
  res: Response,
) {
  try {
    const statusValue = req.query.status;

    const status =
      statusValue === 'active' ||
      statusValue === 'inactive' ||
      statusValue === 'all'
        ? statusValue
        : 'all';

    const result = await getMembershipPlans({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search:
        typeof req.query.search === 'string'
          ? req.query.search
          : '',
      status,
    });

    return res.status(200).json({
      success: true,
      message: 'Membership plans fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to fetch membership plans'),
    });
  }
}

export async function getMembershipPlanByIdHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const planId = getPlanIdParam(req.params.id);

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'A valid membership plan ID is required',
      });
    }

    const plan = await getMembershipPlanById(planId);

    return res.status(200).json({
      success: true,
      message: 'Membership plan fetched successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to fetch membership plan'),
    });
  }
}

export async function createMembershipPlanHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const plan = await createMembershipPlan(req.body);

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to create membership plan'),
    });
  }
}

export async function updateMembershipPlanHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const planId = getPlanIdParam(req.params.id);

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'A valid membership plan ID is required',
      });
    }

    const plan = await updateMembershipPlan(planId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Membership plan updated successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to update membership plan'),
    });
  }
}

export async function deactivateMembershipPlanHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const planId = getPlanIdParam(req.params.id);

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'A valid membership plan ID is required',
      });
    }

    const plan = await deactivateMembershipPlan(planId);

    return res.status(200).json({
      success: true,
      message: 'Membership plan deactivated successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to deactivate membership plan'),
    });
  }
}
