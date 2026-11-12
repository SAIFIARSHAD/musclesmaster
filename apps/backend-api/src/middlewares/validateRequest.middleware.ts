
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed.',
      errors: errors.array().map((error) => ({
        field: 'path' in error ? error.path : 'unknown',
        message: error.msg,
      })),
    });
  }

  next();
};
