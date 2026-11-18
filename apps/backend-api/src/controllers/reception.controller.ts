import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Branch } from '../models/Branch.model';

export const getReceptionBranchHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const branchId = req.user?.branchId;

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message: 'No branch is assigned to this account',
      });
    }

    const branch = await Branch.findById(branchId)
      .select('name code address city state phone email isActive')
      .lean();

    if (!branch || !branch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Assigned branch not found or inactive',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reception branch fetched successfully',
      data: branch,
    });
  } catch (error) {
    console.error('Get reception branch error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch assigned branch',
    });
  }
};
