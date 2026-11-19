
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Branch } from '../models/Branch.model';
import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';

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

export const getReceptionTrainersHandler = async (
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

    const branch = await Branch.findOne({
      _id: branchId,
      isActive: true,
    }).select('_id');

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Assigned branch not found or inactive',
      });
    }

      const trainers = await User.find({
        branchId: String(branch._id),
        role: UserRole.TRAINER,
        isActive: true,
      })
        .select('_id name email mobile role branchId isActive')
        .sort({ name: 1 })
        .lean();

    return res.status(200).json({
      success: true,
      message: 'Branch trainers fetched successfully',
      data: trainers,
    });
  } catch (error) {
    console.error('Get reception trainers error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch branch trainers',
    });
  }
};
