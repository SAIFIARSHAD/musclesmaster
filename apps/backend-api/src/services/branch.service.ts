import mongoose from 'mongoose';
import { Branch } from '../models/Branch.model';
import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';

export interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  managerId?: string | null;
  gstNumber?: string;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export interface BranchListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

type NormalizedBranchData = Record<string, unknown>;

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

function normalize(data: NormalizedBranchData): NormalizedBranchData {
  const result: NormalizedBranchData = { ...data };

  const uppercaseFields = ['code', 'gstNumber'];
  const stringFields = [
    'name',
    'code',
    'address',
    'city',
    'state',
    'phone',
    'email',
    'managerName',
    'gstNumber',
  ];

  for (const field of stringFields) {
    const value = result[field];

    if (typeof value === 'string') {
      result[field] = uppercaseFields.includes(field)
        ? value.trim().toUpperCase()
        : value.trim();
    }
  }

  if (typeof result.email === 'string') {
    result.email = result.email.toLowerCase();
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
    return fail('A branch with this code already exists', 409);
  }

  throw error;
}

function validateGst(gstNumber?: string) {
  if (!gstNumber) return;

  const normalized = gstNumber.trim().toUpperCase();

  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      normalized,
    )
  ) {
    fail('Invalid GST number format', 400);
  }
}

async function validateManager(
  managerId: string | null | undefined,
  branchId: string,
) {
  if (!managerId) return null;

  if (!mongoose.isValidObjectId(managerId)) {
    return fail('Invalid manager ID', 400);
  }

  const manager = await User.findById(managerId);

  if (!manager) {
    return fail('Manager user not found', 404);
  }

  if (manager.role !== UserRole.BRANCH_ADMIN) {
    return fail('Branch manager must be a Branch Admin', 400);
  }

  if (!manager.isActive) {
    return fail('Branch manager must be active', 400);
  }

  if (String(manager.branchId || '') !== branchId) {
    return fail('Manager must belong to this branch', 400);
  }

  const existingAssignment = await Branch.findOne({
    managerId: manager._id,
    _id: { $ne: branchId },
  });

  if (existingAssignment) {
    return fail(
      'This manager is already assigned to another branch',
      409,
    );
  }

  return manager;
}

export async function createBranch(data: CreateBranchInput) {
  const normalized = normalize(
    data as unknown as NormalizedBranchData,
  );

  validateGst(normalized.gstNumber as string | undefined);

  try {
    return await Branch.create(normalized);
  } catch (error) {
    return handleError(error);
  }
}

export async function getBranches(options: BranchListOptions = {}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
  const search = options.search?.trim();

  const filter: Record<string, unknown> = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    filter.$or = [
      { name: regex },
      { code: regex },
      { city: regex },
    ];
  }

  if (options.status === 'active') filter.isActive = true;
  if (options.status === 'inactive') filter.isActive = false;

  const [data, total] = await Promise.all([
    Branch.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Branch.countDocuments(filter),
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

export async function getBranchById(branchId: string) {
  if (!mongoose.isValidObjectId(branchId)) {
    return fail('Invalid branch ID', 400);
  }

  const branch = await Branch.findById(branchId).lean();

  if (!branch) return fail('Branch not found', 404);

  return branch;
}

export async function updateBranch(
  branchId: string,
  data: UpdateBranchInput,
) {
  if (!mongoose.isValidObjectId(branchId)) {
    return fail('Invalid branch ID', 400);
  }

  const normalized = normalize(
    data as NormalizedBranchData,
  );

if (
  Object.prototype.hasOwnProperty.call(data, 'managerId') ||
  Object.prototype.hasOwnProperty.call(data, 'managerName')
) {
  return fail(
    'Branch manager assignment must be managed through User Management',
    400,
  );
}

  if (typeof normalized.gstNumber === 'string') {
    validateGst(normalized.gstNumber);
  }

  try {
    const current = await Branch.findById(branchId);

    if (!current) return fail('Branch not found', 404);

       const updated = await Branch.findByIdAndUpdate(
      branchId,
      { $set: normalized },
      { new: true, runValidators: true },
    );

    if (!updated) return fail('Branch not found', 404);

    return updated;
  } catch (error) {
    return handleError(error);
  }
}



export async function updateBranchStatus(
  branchId: string,
  isActive: boolean,
) {
  if (!mongoose.isValidObjectId(branchId)) {
    return fail('Invalid branch ID', 400);
  }

  const branch = await Branch.findById(branchId);

  if (!branch) {
    return fail('Branch not found', 404);
  }

  // Don't deactivate a branch if either record indicates
  // that a Branch Admin is assigned to it.
  if (!isActive) {
    const hasManagerAssignment = Boolean(branch.managerId);

    const hasLegacyManagerAssignment = await User.exists({
      role: UserRole.BRANCH_ADMIN,
      branchId: String(branch._id),
    });

    if (hasManagerAssignment || hasLegacyManagerAssignment) {
      return fail(
        'Cannot deactivate a branch while a Branch Admin is assigned. Reassign or release the manager first.',
        409,
      );
    }
  }

  branch.isActive = isActive;
  await branch.save();

  return branch;
}



/**
 * Active branches that do not have a Branch Admin assigned.
 * Check both Branch.managerId and User.branchId to tolerate
 * inconsistent legacy assignment records.
 */
export async function getAvailableBranchesForManager() {
  const branches = await Branch.find({
    isActive: true,
    managerId: null,
  })
    .sort({ name: 1 })
    .lean();

  if (branches.length === 0) {
    return [];
  }

  const branchIds = branches.map((branch) => String(branch._id));

  const assignedUsers = await User.find({
    role: UserRole.BRANCH_ADMIN,
    branchId: { $in: branchIds },
  })
    .select('branchId')
    .lean();

  const assignedBranchIds = new Set(
    assignedUsers.map((user) => String(user.branchId)),
  );

  return branches.filter(
    (branch) => !assignedBranchIds.has(String(branch._id)),
  );
}
