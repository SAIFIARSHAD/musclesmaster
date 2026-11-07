import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { AuthRequest } from './auth.middleware';
import { Branch } from '../models/Branch.model';
import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';

/**
 * Reads a branch ID from the route, query, or request body.
 * Route parameters take precedence over query/body values.
 */
function getRequestedBranchId(req: AuthRequest): string | undefined {
  const routeId = req.params.branchId ?? req.params.id;

  if (typeof routeId === 'string' && routeId.trim()) {
    return routeId.trim();
  }

  const queryId = req.query.branchId;

  if (typeof queryId === 'string' && queryId.trim()) {
    return queryId.trim();
  }

  const bodyId = req.body?.branchId;

  if (typeof bodyId === 'string' && bodyId.trim()) {
    return bodyId.trim();
  }

  return undefined;
}

/**
 * Allows Super Admin to access all branches.
 * Restricts other authenticated users to their assigned branch.
 *
 * Apply this middleware only to routes that are intended to be
 * branch-scoped. Do not use it on public routes.
 */
export async function branchAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = req.user;

    if (!actor) {
      res.status(401).json({
        success: false,
        message: 'Authentication is required',
      });
      return;
    }

    if (actor.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
      res.status(403).json({
        success: false,
        message: 'No valid branch is assigned to this account',
      });
      return;
    }

    const requestedBranchId = getRequestedBranchId(req);

    if (
      requestedBranchId &&
      (
        !mongoose.isValidObjectId(requestedBranchId) ||
        requestedBranchId !== actor.branchId
      )
    ) {
      res.status(403).json({
        success: false,
        message: 'You can access your assigned branch only',
      });
      return;
    }

    const branch = await Branch.findById(actor.branchId)
      .select('_id isActive')
      .lean();

    if (!branch || !branch.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your branch is unavailable or inactive',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validates that a manager is an active Branch Admin assigned
 * to the specified branch and is not already managing another branch.
 *
 * This is a reusable validation helper, not an Express middleware.
 */
export async function validateBranchManager(
  managerId: string,
  branchId: string,
): Promise<void> {
  if (
    !mongoose.isValidObjectId(managerId) ||
    !mongoose.isValidObjectId(branchId)
  ) {
    throw Object.assign(new Error('Invalid manager or branch ID'), {
      statusCode: 400,
    });
  }

  const [manager, branch] = await Promise.all([
    User.findById(managerId).select(
      '_id role branchId isActive',
    ),
    Branch.findById(branchId).select('_id'),
  ]);

  if (!branch) {
    throw Object.assign(new Error('Branch not found'), {
      statusCode: 404,
    });
  }

  if (!manager) {
    throw Object.assign(new Error('Manager user not found'), {
      statusCode: 404,
    });
  }

  if (manager.role !== UserRole.BRANCH_ADMIN) {
    throw Object.assign(
      new Error('Branch manager must be a Branch Admin'),
      { statusCode: 400 },
    );
  }

  if (!manager.isActive) {
    throw Object.assign(
      new Error('Branch manager must be active'),
      { statusCode: 400 },
    );
  }

  if (String(manager.branchId ?? '') !== branchId) {
    throw Object.assign(
      new Error('Manager must belong to this branch'),
      { statusCode: 400 },
    );
  }

  const existingAssignment = await Branch.findOne({
    managerId: manager._id,
    _id: { $ne: branch._id },
  }).select('_id');

  if (existingAssignment) {
    throw Object.assign(
      new Error('This manager is already assigned to another branch'),
      { statusCode: 409 },
    );
  }
}
