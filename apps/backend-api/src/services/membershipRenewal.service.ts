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

export interface RenewMembershipInput {
  membershipId: string;
  planId: string;
  notes?: string;
}

export interface RenewalActor {
  userId: string;
  role: UserRole;
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

/**
 * Create a pending renewal membership.
 *
 * Existing membership remains unchanged until payment is confirmed.
 * Payment integration and activation will be handled in Week 7.
 */
export const renewMembership = async (
  input: RenewMembershipInput,
  actor: RenewalActor,
) => {
  if (
    !mongoose.isValidObjectId(input.membershipId) ||
    !mongoose.isValidObjectId(input.planId)
  ) {
    return fail('Invalid membership ID or membership plan ID.', 400);
  }

  if (
    ![
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_ADMIN,
      UserRole.RECEPTION,
    ].includes(actor.role)
  ) {
    return fail('You are not authorized to renew memberships.', 403);
  }

  const session = await mongoose.startSession();

  try {
    const newMembershipId = await session.withTransaction(async () => {
      const existingMembership = await Membership.findById(
        input.membershipId,
      ).session(session);

      if (!existingMembership) {
        return fail('Membership not found.', 404);
      }

      // Renewal is allowed only for ACTIVE or EXPIRED memberships.
      if (
        ![
          MembershipStatus.ACTIVE,
          MembershipStatus.EXPIRED,
        ].includes(existingMembership.status)
      ) {
        return fail(
          'Only active or expired memberships can be renewed. Pending or frozen memberships cannot be renewed.',
          400,
        );
      }

      const branchId = existingMembership.branchId.toString();

      // Branch-level access validation.
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        (!actor.branchId || actor.branchId !== branchId)
      ) {
        return fail(
          'You are not authorized to renew memberships from this branch.',
          403,
        );
      }

      const member = await Member.findById(
        existingMembership.memberId,
      ).session(session);

      if (!member) {
        return fail('Member not found.', 404);
      }

      const branch = await Branch.findById(branchId).session(session);

      if (!branch || !branch.isActive) {
        return fail('Member branch is not active.', 400);
      }

      const plan = await MembershipPlan.findById(input.planId).session(
        session,
      );

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

      // Do not create multiple pending memberships for one member.
      const pendingMembership = await Membership.findOne({
        memberId: member._id,
        status: MembershipStatus.PENDING,
      }).session(session);

      if (pendingMembership) {
        return fail(
          'This member already has a pending membership. Complete or resolve its payment first.',
          409,
        );
      }

      // Active membership: renewal starts the day after its end date.
      // Expired membership: renewal starts today (UTC).
      let startDate: Date;

      if (existingMembership.status === MembershipStatus.ACTIVE) {
        startDate = new Date(existingMembership.endDate);
        startDate.setUTCHours(0, 0, 0, 0);
        startDate.setUTCDate(startDate.getUTCDate() + 1);
      } else {
        const now = new Date();
        startDate = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
          ),
        );
      }

      const endDate = calculateEndDate(startDate, plan.duration);

      const [newMembership] = await Membership.create(
        [
          {
            memberId: member._id,
            planId: plan._id,
            branchId: member.branchId,
            paymentId: null,
            startDate,
            endDate,
            status: MembershipStatus.PENDING,
            freezeDays: 0,
          },
        ],
        { session },
      );

      // Record renewal against the previous membership.
      await MembershipHistory.create(
        [
          {
            membershipId: existingMembership._id,
            memberId: member._id,
            branchId: member.branchId,
            action: MembershipHistoryAction.RENEWED,
            previousStatus: existingMembership.status,
            newStatus: existingMembership.status,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes:
              input.notes?.trim() ||
              'Renewal initiated; awaiting payment confirmation.',
            metadata: {
              newMembershipId: newMembership._id.toString(),
              newPlanId: plan._id.toString(),
              planName: plan.planName,
              duration: plan.duration,
              startDate,
              endDate,
              paymentStatus: 'PENDING',
            },
          },
        ],
        { session },
      );

      // Also keep renewal history on the newly created membership.
      await MembershipHistory.create(
        [
          {
            membershipId: newMembership._id,
            memberId: member._id,
            branchId: member.branchId,
            action: MembershipHistoryAction.RENEWED,
            newStatus: MembershipStatus.PENDING,
            performedBy: new mongoose.Types.ObjectId(actor.userId),
            notes: 'Renewal membership created; awaiting payment.',
            metadata: {
              previousMembershipId: existingMembership._id.toString(),
              planName: plan.planName,
              planType: plan.planType,
              duration: plan.duration,
              ptIncluded: plan.ptIncluded,
              trainerId: member.trainerId || null,
              paymentStatus: 'PENDING',
            },
          },
        ],
        { session },
      );

      return newMembership._id;
    });

    if (!newMembershipId) {
      return fail('Membership renewal failed.', 500);
    }

    const result = await populateMembership(
      Membership.findById(newMembershipId),
    );

    if (!result) {
      return fail(
        'Renewal was created but could not be retrieved.',
        500,
      );
    }

    return result;
  } finally {
    await session.endSession();
  }
};
