import mongoose from 'mongoose';
import {
  MembershipPlan,
  MembershipPlanStatus,
  MembershipPlanType,
} from '../models/MembershipPlan.model';

export interface CreateMembershipPlanInput {
  planName: string;
  planType: MembershipPlanType;
  duration: number;
  price: number;
  description?: string;
  ptIncluded?: boolean;
}

export type UpdateMembershipPlanInput =
  Partial<CreateMembershipPlanInput>;

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

export async function updateMembershipPlan(
  planId: string,
  data: UpdateMembershipPlanInput,
) {
  validatePlanId(planId);

  const normalized = normalize(data);

  const updated = await MembershipPlan.findByIdAndUpdate(
    planId,
    { $set: normalized },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updated) {
    return fail('Membership plan not found', 404);
  }

  return updated;
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
