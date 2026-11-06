
import mongoose from 'mongoose';

import { Member } from '../models/Member.model';
import { Membership, MembershipStatus } from '../models/Membership.model';
import {
  MembershipPlan,
  MembershipPlanStatus,
} from '../models/MembershipPlan.model';
import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../models/MembershipHistory.model';
import { Branch } from '../models/Branch.model';
import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';

export interface MembershipActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export interface AssignMembershipInput {
  memberId: string;
  planId: string;
  startDate: string;
  notes?: string;
}

export interface MembershipListOptions {
  page?: number;
  limit?: number;
  status?: string;
  memberId?: string;
  planId?: string;
  branchId?: string;
}

const fail = (message: string, statusCode = 400): never => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  throw error;
};

const calculateEndDate = (startDate: Date, duration: number): Date => {
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + duration - 1);
  return endDate;
};

const populateMembership = (query: any) =>
  query
    .populate('memberId', 'memberId firstName lastName email mobile')
    .populate('planId', 'planName planType duration price ptIncluded')
    .populate('branchId', 'name code');

const validateOptionalObjectId = (
  value: string | undefined,
  label: string,
): void => {
  if (value && !mongoose.isValidObjectId(value)) {
    return fail(`Invalid ${label}.`, 400);
  }
};

/**
 * Assign membership to a member.
 *
 * Membership remains PENDING until payment is confirmed.
 * Payment integration will activate it in Week 7.
 */
export const assignMembership = async (
  input: AssignMembershipInput,
  actor: MembershipActor,
) => {
  if (
    !mongoose.isValidObjectId(input.memberId) ||
    !mongoose.isValidObjectId(input.planId)
  ) {
    return fail('Invalid member ID or membership plan ID.', 400);
  }

  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return fail('Start date must be in YYYY-MM-DD format.', 400);
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);

  if (
    Number.isNaN(startDate.getTime()) ||
    startDate.toISOString().slice(0, 10) !== input.startDate
  ) {
    return fail('Please provide a valid start date.', 400);
  }

  const session = await mongoose.startSession();

  try {
    const createdMembershipId = await session.withTransaction(async () => {
      const member = await Member.findById(input.memberId).session(session);

      if (!member) {
        return fail('Member not found.', 404);
      }

      const branchId = member.branchId.toString();

      // Branch-level access validation.
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        (!actor.branchId || actor.branchId !== branchId)
      ) {
        return fail(
          'You are not authorized to assign membership to this member.',
          403,
        );
      }

      // Only permitted staff roles can assign memberships.
      if (
        ![
          UserRole.SUPER_ADMIN,
          UserRole.BRANCH_ADMIN,
          UserRole.RECEPTION,
        ].includes(actor.role)
      ) {
        return fail('You are not authorized to assign membership.', 403);
      }

      const branch = await Branch.findById(branchId).session(session);

      if (!branch || !branch.isActive) {
        return fail('Member branch is not active.', 400);
      }

      const plan = await MembershipPlan.findById(input.planId).session(session);

      if (!plan) {
        return fail('Membership plan not found.', 404);
      }

      if (plan.status !== MembershipPlanStatus.ACTIVE) {
        return fail('This membership plan is inactive.', 400);
      }

      // PT plan requires an existing active trainer.
      if (plan.ptIncluded) {
        if (!member.trainerId) {
          return fail(
            'This plan includes Personal Training. Please assign a trainer to the member first.',
            400,
          );
        }

        const trainer = await User.findOne({
          _id: member.trainerId,
          role: UserRole.TRAINER,
          branchId,
          isActive: true,
        }).session(session);

        if (!trainer) {
          return fail(
            'The member does not have a valid active trainer assigned in this branch.',
            400,
          );
        }
      }

      // Prevent duplicate pending, active or frozen memberships.
      const existingMembership = await Membership.findOne({
        memberId: member._id,
        status: {
          $in: [
            MembershipStatus.PENDING,
            MembershipStatus.ACTIVE,
            MembershipStatus.FROZEN,
          ],
        },
      }).session(session);

      if (existingMembership) {
        return fail(
          'This member already has a pending, active or frozen membership. Please resolve the existing membership first.',
          409,
        );
      }

      const endDate = calculateEndDate(startDate, plan.duration);

      const [membership] = await Membership.create(
        [
          {
            memberId: member._id,
            planId: plan._id,
            branchId: member.branchId,
            paymentId: null,
            startDate,
            endDate,
            status: MembershipStatus.PENDING,
          },
        ],
        { session },
      );

      await MembershipHistory.create(
        [
          {
            membershipId: membership._id,
            memberId: member._id,
            branchId: member.branchId,
            action: MembershipHistoryAction.ASSIGNED,
            newStatus: MembershipStatus.PENDING,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes:
              input.notes?.trim() ||
              'Membership assigned; awaiting payment.',
            metadata: {
              planName: plan.planName,
              planType: plan.planType,
              duration: plan.duration,
              ptIncluded: plan.ptIncluded,
              trainerId: member.trainerId || null,
            },
          },
        ],
        { session },
      );

      return membership._id;
    });

    if (!createdMembershipId) {
      return fail('Membership assignment failed.', 500);
    }

    const result = await populateMembership(
      Membership.findById(createdMembershipId),
    );

    if (!result) {
      return fail('Membership was created but could not be retrieved.', 500);
    }

    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Get memberships with filters and pagination.
 *
 * Super Admin: all branches, optional branch filter.
 * Branch Admin / Reception: assigned branch only.
 * Member: own memberships only.
 */
export const getMemberships = async (
  options: MembershipListOptions,
  actor: MembershipActor,
) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));

  const filter: Record<string, unknown> = {};

  // Branch-level and member-level access control.
  if (
    actor.role === UserRole.BRANCH_ADMIN ||
    actor.role === UserRole.RECEPTION
  ) {
    if (!actor.branchId || !mongoose.isValidObjectId(actor.branchId)) {
      return fail('A valid assigned branch is required.', 403);
    }

    if (options.branchId && options.branchId !== actor.branchId) {
      return fail(
        'You can access memberships from your assigned branch only.',
        403,
      );
    }

    filter.branchId = new mongoose.Types.ObjectId(actor.branchId);
  } else if (actor.role === UserRole.SUPER_ADMIN) {
    validateOptionalObjectId(options.branchId, 'branch ID');

    if (options.branchId) {
      filter.branchId = new mongoose.Types.ObjectId(options.branchId);
    }
  } else if (actor.role === UserRole.MEMBER) {
    const member = await Member.findOne({ userId: actor.userId }).select('_id');

    if (!member) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    filter.memberId = member._id;
  } else {
    return fail('Access denied.', 403);
  }

  // Prevent member or staff from using invalid filters.
  validateOptionalObjectId(options.memberId, 'member ID');
  validateOptionalObjectId(options.planId, 'membership plan ID');

  if (options.memberId) {
    if (
      actor.role === UserRole.MEMBER &&
      !(await Member.exists({
        _id: options.memberId,
        userId: actor.userId,
      }))
    ) {
      return fail('You can access your own memberships only.', 403);
    }

    filter.memberId = new mongoose.Types.ObjectId(options.memberId);
  }

  if (options.planId) {
    filter.planId = new mongoose.Types.ObjectId(options.planId);
  }

  if (options.status) {
    if (
      !Object.values(MembershipStatus).includes(
        options.status as MembershipStatus,
      )
    ) {
      return fail('Invalid membership status.', 400);
    }

    filter.status = options.status;
  }

  const [data, total] = await Promise.all([
    populateMembership(
      Membership.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ).lean(),

    Membership.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get one membership's complete details.
 *
 * Super Admin: any branch.
 * Branch Admin / Reception: assigned branch only.
 * Member: own membership only.
 */
export const getMembershipById = async (
  membershipId: string,
  actor: MembershipActor,
) => {
  if (!mongoose.isValidObjectId(membershipId)) {
    return fail('Invalid membership ID.', 400);
  }

  const membership = await Membership.findById(membershipId);

  if (!membership) {
    return fail('Membership not found.', 404);
  }

  if (
    actor.role === UserRole.BRANCH_ADMIN ||
    actor.role === UserRole.RECEPTION
  ) {
    if (
      !actor.branchId ||
      String(membership.branchId) !== actor.branchId
    ) {
      return fail(
        'You can access memberships from your assigned branch only.',
        403,
      );
    }
  } else if (actor.role === UserRole.MEMBER) {
    const member = await Member.findOne({
      _id: membership.memberId,
      userId: actor.userId,
    }).select('_id');

    if (!member) {
      return fail('You can access your own memberships only.', 403);
    }
  } else if (actor.role !== UserRole.SUPER_ADMIN) {
    return fail('Access denied.', 403);
  }

  const result = await populateMembership(
    Membership.findById(membershipId),
  ).lean();

  if (!result) {
    return fail('Membership not found.', 404);
  }

  const history = await MembershipHistory.find({
    membershipId: membership._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    membership: result,
    history,
  };
};
