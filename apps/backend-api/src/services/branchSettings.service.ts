
import mongoose from 'mongoose';
import { Branch } from '../models/Branch.model';
import { BranchSettings } from '../models/BranchSettings.model';

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

async function ensureBranchExists(branchId: string) {
  if (!mongoose.isValidObjectId(branchId)) {
    return fail('Invalid branch ID', 400);
  }

  const branch = await Branch.findById(branchId)
    .select('_id isActive')
    .lean();

  if (!branch) {
    return fail('Branch not found', 404);
  }

  return branch;
}

export async function getBranchSettings(branchId: string) {
  await ensureBranchExists(branchId);

  // Atomic upsert avoids a separate find-then-create sequence.
  return BranchSettings.findOneAndUpdate(
    { branchId },
    { $setOnInsert: { branchId } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
}

export interface UpdateBranchSettingsInput {
  timezone?: string;
  currency?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  attendanceWindow?: {
    checkInStart: string;
    checkInEnd: string;
    checkOutStart: string;
    checkOutEnd: string;
  };
}

export async function updateBranchSettings(
  branchId: string,
  data: UpdateBranchSettingsInput,
) {
  await ensureBranchExists(branchId);

  const allowedFields = [
    'timezone',
    'currency',
    'workingHours',
    'attendanceWindow',
  ] as const;

  const update: Partial<UpdateBranchSettingsInput> = {};

  for (const key of allowedFields) {
    const value = data?.[key];

    if (value !== undefined) {
      Object.assign(update, { [key]: value });
    }
  }

  if (Object.keys(update).length === 0) {
    return fail('At least one valid setting is required', 400);
  }

  return BranchSettings.findOneAndUpdate(
    { branchId },
    {
      $set: update,
      $setOnInsert: { branchId },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
}
