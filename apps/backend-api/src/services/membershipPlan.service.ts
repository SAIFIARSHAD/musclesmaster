import mongoose from 'mongoose';

import {
  MembershipPlan,
  MembershipPlanStatus,
  MembershipPlanType,
} from '../models/MembershipPlan.model';

import {
  Membership,
  MembershipStatus,
} from '../models/Membership.model';

import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../models/MembershipHistory.model';

export interface CreateMembershipPlanInput {
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded?: boolean;
}

export type UpdateMembershipPlanInput =
  Partial<CreateMembershipPlanInput> & {
    status?: MembershipPlanStatus;
  };

export interface MembershipPlanListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

function validatePlanId(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    fail('Invalid membership plan ID', 400);
  }
}

function normalize(
  data: CreateMembershipPlanInput | UpdateMembershipPlanInput,
) {
  const result = { ...data };

  if (typeof result.planName === 'string') {
    result.planName = result.planName.trim();
  }

  if (typeof result.description === 'string') {
    result.description = result.description.trim();
  }

  return result;
}

function handleError(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    return fail('A membership plan with these details already exists', 409);
  }

  throw error;
}

export async function createMembershipPlan(
  data: CreateMembershipPlanInput,
) {
  const normalized = normalize(data);

  try {
    return await MembershipPlan.create({
      ...normalized,
      status: MembershipPlanStatus.ACTIVE,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getMembershipPlans(
  options: MembershipPlanListOptions = {},
) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
  const search = options.search?.trim();

  const filter: Record<string, unknown> = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    filter.$or = [
      { planName: regex },
      { description: regex },
      { planType: regex },
    ];
  }

  if (options.status === 'active') {
    filter.status = MembershipPlanStatus.ACTIVE;
  }

  if (options.status === 'inactive') {
    filter.status = MembershipPlanStatus.INACTIVE;
  }

  const [data, total] = await Promise.all([
    MembershipPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    MembershipPlan.countDocuments(filter),
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
}

export async function getMembershipPlanById(planId: string) {
  validatePlanId(planId);

  const plan = await MembershipPlan.findById(planId).lean();

  if (!plan) {
    return fail('Membership plan not found', 404);
  }

  return plan;
}

/**
 * Update a membership plan.
 *
 * When plan price changes:
 * - Only PENDING memberships are repriced.
 * - ACTIVE and FROZEN memberships retain their agreed amount.
 * - Existing payment records are never modified.
 * - Every repriced membership gets a history entry.
 *
 * Plan and membership changes execute in one MongoDB transaction.
 */
export async function updateMembershipPlan(
  planId: string,
  data: UpdateMembershipPlanInput,
  actorUserId: string,
) {
  validatePlanId(planId);

  if (!mongoose.isValidObjectId(actorUserId)) {
    return fail('A valid admin user ID is required', 401);
  }

  const normalized = normalize(data);

  const session = await mongoose.startSession();

  let updatedPlan: InstanceType<typeof MembershipPlan> | null = null;
  let repricedMemberships = 0;

  try {
    await session.withTransaction(async () => {
      // Reset values because MongoDB may retry a transaction callback.
      updatedPlan = null;
      repricedMemberships = 0;

      const currentPlan = await MembershipPlan.findById(planId)
        .session(session);

      if (!currentPlan) {
        return fail('Membership plan not found', 404);
      }

      const previousPrice = Number(currentPlan.price);
      const priceWasProvided = typeof normalized.price === 'number';

      const priceChanged =
        priceWasProvided &&
        Number(normalized.price) !== previousPrice;

      // Update the plan first, inside the same transaction.
      updatedPlan = await MembershipPlan.findByIdAndUpdate(
        planId,
        { $set: normalized },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!updatedPlan) {
        return fail('Membership plan update failed', 500);
      }

      // No price change: no membership repricing is needed.
      if (!priceChanged) {
        return;
      }

      const newPrice = Number(normalized.price);

      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        return fail('Membership plan price must be greater than zero', 400);
      }

      // Only pending memberships can receive the new plan price.
      const pendingMemberships = await Membership.find({
        planId: currentPlan._id,
        status: MembershipStatus.PENDING,
      }).session(session);

      for (const membership of pendingMemberships) {
        const oldAmount = Number(membership.agreedAmount);

        // Avoid unnecessary history entries.
        if (oldAmount === newPrice) {
          continue;
        }

        // Recheck status while updating.
        const updatedMembership = await Membership.findOneAndUpdate(
          {
            _id: membership._id,
            status: MembershipStatus.PENDING,
          },
          {
            $set: {
              agreedAmount: newPrice,
            },
          },
          {
            new: true,
            runValidators: true,
            session,
          },
        );

        if (!updatedMembership) {
          continue;
        }

        await MembershipHistory.create(
          [
            {
              membershipId: membership._id,
              memberId: membership.memberId,
              branchId: membership.branchId,
              action: MembershipHistoryAction.PRICE_UPDATED,
              performedBy: new mongoose.Types.ObjectId(actorUserId),
              notes:
                'Pending membership price updated due to membership plan price change.',
              metadata: {
                previousAmount: oldAmount,
                newAmount: newPrice,
                planId: currentPlan._id,
                previousPlanPrice: previousPrice,
                newPlanPrice: newPrice,
              },
            },
          ],
          { session },
        );

        repricedMemberships += 1;
      }
    });

    if (!updatedPlan) {
      return fail('Membership plan update failed', 500);
    }

    return {
      plan: updatedPlan,
      repricedMemberships,
    };
  } catch (error) {
    return handleError(error);
  } finally {
    await session.endSession();
  }
}

export async function deactivateMembershipPlan(planId: string) {
  validatePlanId(planId);

  const plan = await MembershipPlan.findById(planId);

  if (!plan) {
    return fail('Membership plan not found', 404);
  }

  if (plan.status === MembershipPlanStatus.INACTIVE) {
    return plan;
  }

  plan.status = MembershipPlanStatus.INACTIVE;
  await plan.save();

  return plan;
}
