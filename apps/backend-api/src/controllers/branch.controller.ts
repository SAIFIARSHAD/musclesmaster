import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  updateBranchStatus,
  getAvailableBranchesForManager,
} from '../services/branch.service';

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

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getBranchesHandler(
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

    const result = await getBranches({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: typeof req.query.search === 'string'
        ? req.query.search
        : '',
      status,
    });

    return res.status(200).json({
      success: true,
      message: 'Branches fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to fetch branches'),
    });
  }
}

export async function getBranchByIdHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const branchId = getBranchIdParam(req.params.id);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'A valid branch ID is required',
      });
    }

    const branch = await getBranchById(branchId);

    return res.status(200).json({
      success: true,
      message: 'Branch fetched successfully',
      data: branch,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to fetch branch'),
    });
  }
}

export async function createBranchHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const branch = await createBranch(req.body);

    return res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to create branch'),
    });
  }
}

export async function updateBranchHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const branchId = getBranchIdParam(req.params.id);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'A valid branch ID is required',
      });
    }

    const branch = await updateBranch(branchId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: branch,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to update branch'),
    });
  }
}

export async function updateBranchStatusHandler(
  req: AuthRequest,
  res: Response,
) {
  try {
    const branchId = getBranchIdParam(req.params.id);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'A valid branch ID is required',
      });
    }

    const branch = await updateBranchStatus(
      branchId,
      req.body.isActive,
    );

    return res.status(200).json({
      success: true,
      message: `Branch ${branch.isActive ? 'activated' : 'deactivated'} successfully`,
      data: branch,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(error, 'Unable to update branch status'),
    });
  }
}

export async function getAvailableBranchesForManagerHandler(
  _req: AuthRequest,
  res: Response,
) {
  try {
    const branches = await getAvailableBranchesForManager();

    return res.status(200).json({
      success: true,
      message: 'Available branches fetched successfully',
      data: branches,
    });
  } catch (error) {
    return res.status(statusOf(error)).json({
      success: false,
      message: messageOf(
        error,
        'Unable to fetch available branches',
      ),
    });
  }
}
