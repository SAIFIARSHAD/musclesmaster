import { Request, Response } from 'express';
import {
  getBranchSettings,
  updateBranchSettings,
} from '../services/branchSettings.service';

function getBranchIdParam(
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

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to process branch settings';
}

export async function getBranchSettingsHandler(
  req: Request,
  res: Response,
) {
  const branchId = getBranchIdParam(req.params.id);

  if (!branchId) {
    return res.status(400).json({
      success: false,
      message: 'A valid branch ID is required',
    });
  }

  try {
    const data = await getBranchSettings(branchId);

    return res.status(200).json({
      success: true,
      message: 'Branch settings fetched successfully',
      data,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error),
    });
  }
}

export async function updateBranchSettingsHandler(
  req: Request,
  res: Response,
) {
  const branchId = getBranchIdParam(req.params.id);

  if (!branchId) {
    return res.status(400).json({
      success: false,
      message: 'A valid branch ID is required',
    });
  }

  try {
    const data = await updateBranchSettings(branchId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Branch settings updated successfully',
      data,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error),
    });
  }
}
