import { Request, Response, NextFunction } from 'express';

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function sendError(res: Response, message: string) {
  return res.status(400).json({ success: false, message });
}

function validateCommon(
  body: Record<string, unknown>,
  res: Response,
): boolean {
  for (const field of [
    'address',
    'city',
    'state',
    'phone',
    'managerName',
  ]) {
    const value = body[field];

    if (
      value !== undefined &&
      value !== null &&
      typeof value !== 'string'
    ) {
      sendError(res, `${field} must be a string`);
      return false;
    }
  }

  if (body.email !== undefined && body.email !== '') {
    if (
      typeof body.email !== 'string' ||
      !validEmail(body.email.trim())
    ) {
      sendError(res, 'Please provide a valid email address');
      return false;
    }
  }

  if (body.gstNumber !== undefined && body.gstNumber !== '') {
    if (
      typeof body.gstNumber !== 'string' ||
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        body.gstNumber.trim().toUpperCase(),
      )
    ) {
      sendError(res, 'Invalid GST number format');
      return false;
    }
  }

  if (
    body.managerId !== undefined &&
    body.managerId !== null &&
    body.managerId !== '' &&
    (typeof body.managerId !== 'string' ||
      !/^[a-f\d]{24}$/i.test(body.managerId))
  ) {
    sendError(res, 'Invalid manager ID');
    return false;
  }

  return true;
}

export function validateCreateBranch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { name, code } = req.body;

  if (!nonEmpty(name)) return sendError(res, 'Branch name is required');
  if (!nonEmpty(code)) return sendError(res, 'Branch code is required');

  if (code.trim().length > 30) {
    return sendError(res, 'Branch code cannot exceed 30 characters');
  }

  if (
  req.body.managerId !== undefined ||
  req.body.managerName !== undefined
) {
  return sendError(
    res,
    'Branch manager assignment must be managed through User Management',
  );
}

  if (!validateCommon(req.body, res)) return;

  next();
}


export function validateUpdateBranch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    req.body.managerId !== undefined ||
    req.body.managerName !== undefined
  ) {
    return sendError(
      res,
      'Branch manager assignment must be managed through User Management',
    );
  }

  const allowedFields = [
    'name',
    'code',
    'address',
    'city',
    'state',
    'phone',
    'email',
    'gstNumber',
  ];

  const hasAllowedField = allowedFields.some(
    (field) => req.body[field] !== undefined,
  );

  if (!hasAllowedField) {
    return sendError(
      res,
      'At least one branch field is required',
    );
  }

  if (req.body.name !== undefined && !nonEmpty(req.body.name)) {
    return sendError(res, 'Branch name cannot be empty');
  }

  if (req.body.code !== undefined) {
    if (!nonEmpty(req.body.code)) {
      return sendError(res, 'Branch code cannot be empty');
    }

    if (req.body.code.trim().length > 30) {
      return sendError(
        res,
        'Branch code cannot exceed 30 characters',
      );
    }
  }

  if (!validateCommon(req.body, res)) return;

  next();
}


export function validateBranchStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (typeof req.body.isActive !== 'boolean') {
    return sendError(res, 'isActive must be true or false');
  }

  next();
}