import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createMember,
  getMembers,
  updateMember,
  updateMemberTrainer,
  transferMemberBranch,
  getMemberById,
  type CreateMemberInput,
  type UpdateMemberInput,
  type MemberActor,
  type MemberListOptions,
} from '../services/member.service';
import { UserRole } from '../constants/roles.enum';
import { MemberStatus } from '../models/Member.model';

const getErrorStatus = (error: unknown, fallback = 500): number => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  if (
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  if ('code' in error && error.code === 11000) {
    return 409;
  }

  return fallback;
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    return 'A member with this email or mobile number already exists';
  }

  return error instanceof Error && error.message
    ? error.message
    : fallback;
};

const getActor = (req: AuthRequest): MemberActor | null => {
  if (!req.user?.userId) {
    return null;
  }

  return {
    userId: req.user.userId,
    role: req.user.role as UserRole,
    branchId: req.user.branchId,
  };
};

/**
 * POST /api/members
 * Register a new gym member.
 */
export const createMemberHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const memberData: CreateMemberInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      dob: req.body.dob,
      mobile: req.body.mobile,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address,
      branchId: req.body.branchId,
      height: req.body.height,
      weight: req.body.weight,
      fitnessGoal: req.body.fitnessGoal,
      medicalConditions: req.body.medicalConditions,
      trainerId: req.body.trainerId,
    };

    const result = await createMember(memberData, actor);

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Create member error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to register member',
      ),
    });
  }
};

/**
 * GET /api/members
 * Get members with search, filters and pagination.
 */
export const getMembersHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const options: MemberListOptions = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search:
        typeof req.query.search === 'string'
          ? req.query.search
          : undefined,
      status:
        typeof req.query.status === 'string'
          ? req.query.status as MemberStatus
          : undefined,
      branchId:
        typeof req.query.branchId === 'string'
          ? req.query.branchId
          : undefined,
      membershipPlan:
        typeof req.query.membershipPlan === 'string'
          ? req.query.membershipPlan
          : undefined,
    };

    const result = await getMembers(options, actor);

    return res.status(200).json({
      success: true,
      message: 'Members fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    console.error('Get members error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch members',
      ),
    });
  }
};



/**
 * GET /api/members/:memberId
 * Get complete details of one gym member.
 */
export const getMemberByIdHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const memberId = req.params.memberId;

    if (typeof memberId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID',
      });
    }

    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await getMemberById(memberId, actor);

    return res.status(200).json({
      success: true,
      message: 'Member details fetched successfully',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Get member details error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to fetch member details',
      ),
    });
  }
};


export const updateMemberHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const memberId = req.params.memberId;

    if (typeof memberId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID',
      });
    }

    const actor = getActor(req);

    if (!actor) {
  return res.status(401).json({
    success: false,
    message: 'Unauthorized',
  });
}

    const updateData: UpdateMemberInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      dob: req.body.dob,
      mobile: req.body.mobile,
      email: req.body.email,
      address: req.body.address,
      height: req.body.height,
      weight: req.body.weight,
      fitnessGoal: req.body.fitnessGoal,
      medicalConditions: req.body.medicalConditions,
    };

    // Remove undefined fields so only supplied fields are updated.
    Object.keys(updateData).forEach((key) => {
      const field = key as keyof UpdateMemberInput;

      if (updateData[field] === undefined) {
        delete updateData[field];
      }
    });

    const result = await updateMember(memberId, updateData, actor);

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: result,
    });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error, 'Failed to update member'),
    });
  }
};


export const updateMemberTrainerHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { trainerId } = req.body;

    if (
      trainerId !== null &&
      typeof trainerId !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'trainerId must be a string or null',
      });
    }

   const memberId = req.params.memberId;

if (typeof memberId !== 'string') {
  return res.status(400).json({
    success: false,
    message: 'Invalid member ID',
  });
}

const result = await updateMemberTrainer(
  memberId,
  trainerId,
  actor,
);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.member,
    });
  } catch (error: unknown) {
    console.error('Update member trainer error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to update member trainer',
      ),
    });
  }
};

/**
 * PATCH /api/members/:memberId/transfer-branch
 * Transfer a member to another branch.
 */
/**
 * PATCH /api/members/:memberId/transfer-branch
 * Transfer a member to another branch.
 */
export const transferMemberBranchHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const actor = getActor(req);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const memberId = req.params.memberId;

    if (typeof memberId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID',
      });
    }

    const { targetBranchId } = req.body;

    if (
      typeof targetBranchId !== 'string' ||
      !targetBranchId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'targetBranchId is required',
      });
    }

    const result = await transferMemberBranch(
      memberId,
      targetBranchId.trim(),
      actor,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        member: result.member,
        previousBranchId: result.previousBranchId,
        newBranchId: result.newBranchId,
        trainerRemoved: result.trainerRemoved,
      },
    });
  } catch (error: unknown) {
    console.error('Transfer member branch error:', error);

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(
        error,
        'Unable to transfer member to another branch',
      ),
    });
  }
};