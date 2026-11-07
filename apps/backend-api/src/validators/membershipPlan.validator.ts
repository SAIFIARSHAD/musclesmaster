import { Request, Response, NextFunction } from 'express';
import { MembershipPlanType } from '../models/MembershipPlan.model';

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function sendError(res: Response, message: string) {
  return res.status(400).json({
    success: false,
    message,
  });
}

const allowedFields = [
  'planName',
  'planType',
  'duration',
  'price',
  'description',
  'ptIncluded',
];

function validatePlanFields(
  body: Record<string, unknown>,
  res: Response,
  isUpdate: boolean,
): boolean {
  const hasAllowedField = allowedFields.some(
    (field) => body[field] !== undefined,
  );

  if (isUpdate && !hasAllowedField) {
    sendError(res, 'At least one membership plan field is required');
    return false;
  }

  if (!isUpdate || body.planName !== undefined) {
    if (!nonEmpty(body.planName)) {
      sendError(res, 'Plan name is required');
      return false;
    }

    if (body.planName.trim().length > 100) {
      sendError(res, 'Plan name cannot exceed 100 characters');
      return false;
    }
  }

  if (!isUpdate || body.planType !== undefined) {
    if (
      typeof body.planType !== 'string' ||
      !Object.values(MembershipPlanType).includes(
        body.planType as MembershipPlanType,
      )
    ) {
      sendError(res, 'Please provide a valid membership plan type');
      return false;
    }
  }

  if (!isUpdate || body.duration !== undefined) {
    if (
      typeof body.duration !== 'number' ||
      !Number.isInteger(body.duration) ||
      body.duration <= 0
    ) {
      sendError(res, 'Duration must be a positive whole number of days');
      return false;
    }
  }

  if (!isUpdate || body.price !== undefined) {
    if (
      typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price <= 0
    ) {
      sendError(res, 'Price must be greater than zero');
      return false;
    }
  }

  if (
    body.description !== undefined &&
    typeof body.description !== 'string'
  ) {
    sendError(res, 'Description must be a string');
    return false;
  }

  if (
    body.ptIncluded !== undefined &&
    typeof body.ptIncluded !== 'boolean'
  ) {
    sendError(res, 'ptIncluded must be true or false');
    return false;
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    sendError(
      res,
      `Unsupported field(s): ${unknownFields.join(', ')}`,
    );
    return false;
  }

  return true;
}

export function validateCreateMembershipPlan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!validatePlanFields(req.body, res, false)) return;

  next();
}

export function validateUpdateMembershipPlan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!validatePlanFields(req.body, res, true)) return;

  next();
}
