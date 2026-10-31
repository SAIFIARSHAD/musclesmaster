
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { AuthRequest } from './auth.middleware';
import { UserRole } from '../constants/roles.enum';

/**
 * Provides a branch scope for database queries.
 *
 * Super Admin:
 *   Can query across branches unless a branchId is explicitly supplied.
 *
 * Branch Admin and other branch-assigned roles:
 *   Must remain within their assigned branch.
 *
 * Usage:
 *   const scope = getBranchScope(req);
 *   const records = await SomeModel.find({ ...scope });
 *
 * This helper does not modify database queries automatically.
 * Call it explicitly in the relevant service.
 */
export function getBranchScope(
  req: AuthRequest,
): { branchId?: string } {
  const actor = req.user;

  if (!actor) {
    throw Object.assign(new Error('Authentication is required'), {
      statusCode: 401,
    });
  }

  if (actor.role === UserRole.SUPER_ADMIN) {
    const requestedBranchId = readRequestedBranchId(req);

    if (requestedBranchId) {
      if (!mongoose.isValidObjectId(requestedBranchId)) {
        throw Object.assign(new Error('Invalid branch ID'), {
          statusCode: 400,
        });
      }

      return { branchId: requestedBranchId };
    }

    return {};
  }

  if (
    !actor.branchId ||
    !mongoose.isValidObjectId(actor.branchId)
  ) {
    throw Object.assign(
      new Error('No valid branch is assigned to this account'),
      { statusCode: 403 },
    );
  }

  const requestedBranchId = readRequestedBranchId(req);

  if (
    requestedBranchId &&
    (
      !mongoose.isValidObjectId(requestedBranchId) ||
      requestedBranchId !== actor.branchId
    )
  ) {
    throw Object.assign(
      new Error('You can access your assigned branch only'),
      { statusCode: 403 },
    );
  }

  return { branchId: actor.branchId };
}

function readRequestedBranchId(
  req: AuthRequest,
): string | undefined {
  const routeId = req.params.branchId;

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
 * Express middleware wrapper.
 * It validates branch scope and stores it on res.locals.
 *
 * Downstream controllers/services can read:
 *   res.locals.branchScope
 */
export function branchScope(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    res.locals.branchScope = getBranchScope(req);
    next();
  } catch (error) {
    next(error);
  }
}
