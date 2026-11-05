
import mongoose from 'mongoose';

import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';
import { Branch } from '../models/Branch.model';
import {
  Member,
  MemberStatus,
  MemberGender,
} from '../models/Member.model';
import { MemberProfile } from '../models/MemberProfile.model';
import { generateMemberId } from '../utils/generateMemberId';

export interface MemberListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus;
  branchId?: string;
  membershipPlan?: string;
}

export interface MemberActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}



export interface TransferMemberBranchResult {
  member: object;
  message: string;
  previousBranchId: string;
  newBranchId: string;
  trainerRemoved: boolean;
}

export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: Date | string;
  mobile: string;
  email: string;
  password: string;
  address?: string;

  branchId?: string;

  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];

  trainerId?: string;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  gender?: MemberGender;
  dob?: Date | string;
  mobile?: string;
  email?: string;
  address?: string;

  height?: number;
  weight?: number;
  fitnessGoal?: string;
  medicalConditions?: string[];
}

function fail(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

function requireBranchId(value?: string): string {
  if (!value || !mongoose.isValidObjectId(value)) {
    return fail('A valid branch ID is required', 400);
  }

  return value;
}

function getSafeUser(user: {
  toObject: () => Record<string, unknown>;
}): Record<string, unknown> {
  const result = user.toObject();

  delete result.password;
  delete result.resetOtp;
  delete result.resetOtpExpiry;
  delete result.resetVerifiedToken;
  delete result.resetVerifiedTokenExpiry;

  return result;
}

/**
 * Register a new gym member.
 *
 * Creates User, Member and MemberProfile together.
 * All database operations run inside one MongoDB transaction.
 */
export async function createMember(
  data: CreateMemberInput,
  actor: MemberActor,
) {
// Resolve branch based on the logged-in user's role.
let branchId: string;

if (actor.role === UserRole.SUPER_ADMIN) {
  // Super Admin must explicitly select a branch.
  branchId = requireBranchId(data.branchId);
} else if (
  actor.role === UserRole.BRANCH_ADMIN ||
  actor.role === UserRole.RECEPTION
) {
  // Branch Admin and Reception are restricted to their own branch.
  branchId = requireBranchId(actor.branchId);

  // Prevent registering members in another branch.
  if (
    data.branchId &&
    String(data.branchId) !== branchId
  ) {
    return fail(
      'You can register members in your assigned branch only',
      403,
    );
  }
} else {
  return fail(
    'You are not authorized to register members',
    403,
  );
}

  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedMobile = data.mobile.trim();

  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  const session = await mongoose.startSession();

  let registrationResult: {
    user: Record<string, unknown>;
    member: object;
    profile: object;
  } | null = null;

  try {
    await session.withTransaction(async () => {
      // 1. Verify branch.
      const branch = await Branch.findOne({
        _id: branchObjectId,
        isActive: true,
      }).session(session);

      if (!branch) {
        return fail('Branch not found or inactive', 400);
      }

      // 2. Check duplicate email.
      const existingUser = await User.findOne({
        email: normalizedEmail,
      }).session(session);

      if (existingUser) {
        return fail(
          'A user with this email already exists',
          409,
        );
      }

      // 3. Check duplicate mobile within the same branch.
      const existingMember = await Member.findOne({
        branchId: branchObjectId,
        mobile: normalizedMobile,
      }).session(session);

      if (existingMember) {
        return fail(
          'A member with this mobile number already exists in this branch',
          409,
        );
      }

      // 4. Validate assigned trainer, if provided.
      let trainerObjectId: mongoose.Types.ObjectId | null = null;

      if (data.trainerId) {
        if (!mongoose.isValidObjectId(data.trainerId)) {
          return fail('Invalid trainer ID', 400);
        }

        trainerObjectId = new mongoose.Types.ObjectId(
          data.trainerId,
        );

        const trainer = await User.findOne({
          _id: trainerObjectId,
          role: UserRole.TRAINER,
          branchId,
          isActive: true,
        }).session(session);

        if (!trainer) {
          return fail(
            'Trainer not found or not assigned to this branch',
            400,
          );
        }
      }

      // 5. Create User account.
      // Existing User model automatically hashes the password.
      const user = new User({
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: normalizedEmail,
        password: data.password,
        mobile: normalizedMobile,
        role: UserRole.MEMBER,
        branchId,
        isActive: true,
      });

      await user.save({ session });

      // 6. Generate monthly Member ID using branch timezone.
      const memberId = await generateMemberId(
        branchId,
        session,
      );

      // 7. Create Member record.
      const member = new Member({
        userId: user._id,
        memberId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        dob: new Date(data.dob),
        mobile: normalizedMobile,
        email: normalizedEmail,
        address: data.address?.trim(),
        branchId: branchObjectId,
        trainerId: trainerObjectId,
        status: MemberStatus.INACTIVE,
      });

      await member.save({ session });

      // 8. Create MemberProfile record.
      const profile = new MemberProfile({
        memberId: member._id,
        height: data.height,
        weight: data.weight,
        fitnessGoal: data.fitnessGoal?.trim(),
        medicalConditions: data.medicalConditions ?? [],
      });

      await profile.save({ session });

      // 9. Prepare safe response.
      registrationResult = {
        user: getSafeUser(user),
        member: member.toObject(),
        profile: profile.toObject(),
      };
    });

    if (!registrationResult) {
      throw new Error(
        'Member registration could not be completed',
      );
    }

    return registrationResult;
  } finally {
    await session.endSession();
  }
}


/**
 * Get members with pagination, search and filters.
 *
 * Super Admin: all branches.
 * Branch Admin / Reception: assigned branch only.
 */
export async function getMembers(
  options: MemberListOptions,
  actor: MemberActor,
) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));

  const filter: Record<string, unknown> = {};

  // Branch-level access control
  if (
    actor.role === UserRole.BRANCH_ADMIN ||
    actor.role === UserRole.RECEPTION
  ) {
    const branchId = requireBranchId(actor.branchId);

    filter.branchId = new mongoose.Types.ObjectId(branchId);

    // Prevent access to another branch through query parameters.
    if (
      options.branchId &&
      options.branchId !== branchId
    ) {
      return fail(
        'You can access members from your assigned branch only',
        403,
      );
    }
  } else if (actor.role === UserRole.SUPER_ADMIN) {
    if (options.branchId) {
      if (!mongoose.isValidObjectId(options.branchId)) {
        return fail('Invalid branch ID', 400);
      }

      filter.branchId = new mongoose.Types.ObjectId(
        options.branchId,
      );
    }
  } else {
    return fail('Access denied', 403);
  }

  // Status filter
  if (options.status) {
    if (!Object.values(MemberStatus).includes(options.status)) {
      return fail('Invalid member status', 400);
    }

    filter.status = options.status;
  }

  // Membership plan filter
  if (options.membershipPlan) {
    if (!mongoose.isValidObjectId(options.membershipPlan)) {
      return fail('Invalid membership plan ID', 400);
    }

    filter.membershipPlan = new mongoose.Types.ObjectId(
      options.membershipPlan,
    );
  }

  // Search by name, mobile or Member ID
  const search = options.search?.trim();

  if (search) {
    const escaped = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );

    const regex = new RegExp(escaped, 'i');

    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { mobile: regex },
      { memberId: regex },
    ];
  }

  const [data, total] = await Promise.all([
    Member.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Member.countDocuments(filter),
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



/**
 * Get one member's complete profile.
 *
 * Super Admin: any branch.
 * Branch Admin / Reception: assigned branch only.
 * Member: own profile only.
 */
export async function getMemberById(
  memberId: string,
  actor: MemberActor,
) {
  if (!mongoose.isValidObjectId(memberId)) {
    return fail('Invalid member ID', 400);
  }

  const member = await Member.findById(memberId);

  if (!member) {
    return fail('Member not found', 404);
  }

  // Branch-level access control.
  if (
    actor.role === UserRole.BRANCH_ADMIN ||
    actor.role === UserRole.RECEPTION
  ) {
    const branchId = requireBranchId(actor.branchId);

    if (String(member.branchId) !== branchId) {
      return fail(
        'You can access members from your assigned branch only',
        403,
      );
    }
  }

  // Members can view only their own profile.
  if (
    actor.role === UserRole.MEMBER &&
    String(member.userId) !== actor.userId
  ) {
    return fail('You can access your own profile only', 403);
  }

  // Fetch related records.
  const [profile, user, branch, trainer] = await Promise.all([
    MemberProfile.findOne({ memberId: member._id }).lean(),

    User.findById(member.userId)
      .select(
        '_id name email mobile role branchId isActive createdAt updatedAt',
      )
      .lean(),

    Branch.findById(member.branchId)
      .select('_id name code address city state phone email isActive')
      .lean(),

    member.trainerId
      ? User.findOne({
          _id: member.trainerId,
          role: UserRole.TRAINER,
        })
          .select('_id name email mobile role isActive')
          .lean()
      : Promise.resolve(null),
  ]);

  if (!user) {
    return fail('Linked user account not found', 404);
  }

  return {
    member: member.toObject(),
    profile,
    user,
    branch,
    trainer,
  };
}



/**
 * Update member personal and fitness details.
 *
 * Super Admin / Branch Admin: Personal + Fitness details.
 * Reception: Personal details only.
 * Member: Own limited profile only.
 *
 * Member and MemberProfile are updated atomically.
 * Linked User account details are synchronized.
 */
export async function updateMember(
  memberId: string,
  data: UpdateMemberInput,
  actor: MemberActor,
) {
  if (!mongoose.isValidObjectId(memberId)) {
    return fail('Invalid member ID', 400);
  }

  const personalFields = [
    'firstName',
    'lastName',
    'gender',
    'dob',
    'mobile',
    'email',
    'address',
  ];

  const fitnessFields = [
    'height',
    'weight',
    'fitnessGoal',
    'medicalConditions',
  ];

  let allowedFields: string[] = [];

  if (
    actor.role === UserRole.SUPER_ADMIN ||
    actor.role === UserRole.BRANCH_ADMIN
  ) {
    allowedFields = [...personalFields, ...fitnessFields];
  } else if (actor.role === UserRole.RECEPTION) {
    allowedFields = personalFields;
  } else if (actor.role === UserRole.MEMBER) {
    allowedFields = [
      'address',
      'height',
      'weight',
      'fitnessGoal',
      'medicalConditions',
    ];
  } else {
    return fail('Access denied', 403);
  }

  const requestedFields = Object.keys(data);

  if (requestedFields.length === 0) {
    return fail('At least one field is required', 400);
  }

  const restrictedFields = requestedFields.filter(
    (field) => !allowedFields.includes(field),
  );

  if (restrictedFields.length > 0) {
    return fail(
      `You are not allowed to update: ${restrictedFields.join(', ')}`,
      403,
    );
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const member = await Member.findById(memberId).session(session);

      if (!member) {
        return fail('Member not found', 404);
      }

      // Branch-level restrictions.
      if (
        actor.role === UserRole.BRANCH_ADMIN ||
        actor.role === UserRole.RECEPTION
      ) {
        const branchId = requireBranchId(actor.branchId);

        if (String(member.branchId) !== branchId) {
          return fail(
            'You can update members from your assigned branch only',
            403,
          );
        }
      }

      // Members can update only their own profile.
      if (
        actor.role === UserRole.MEMBER &&
        String(member.userId) !== actor.userId
      ) {
        return fail(
          'You can update your own profile only',
          403,
        );
      }

      const user = await User.findById(member.userId).session(session);

      if (!user) {
        return fail('Linked user account not found', 404);
      }

      const normalizedEmail =
        data.email !== undefined
          ? data.email.trim().toLowerCase()
          : undefined;

      const normalizedMobile =
        data.mobile !== undefined
          ? data.mobile.trim()
          : undefined;

      // Check duplicate email in User collection.
      if (normalizedEmail !== undefined) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        }).session(session);

        if (existingUser) {
          return fail(
            'A user with this email already exists',
            409,
          );
        }

        member.email = normalizedEmail;
        user.email = normalizedEmail;
      }

      // Check duplicate mobile within the same branch.
      if (normalizedMobile !== undefined) {
        const duplicateMobile = await Member.findOne({
          branchId: member.branchId,
          mobile: normalizedMobile,
          _id: { $ne: member._id },
        }).session(session);

        if (duplicateMobile) {
          return fail(
            'A member with this mobile number already exists in this branch',
            409,
          );
        }

        member.mobile = normalizedMobile;
        user.mobile = normalizedMobile;
      }

      // Update personal information.
      if (data.firstName !== undefined) {
        member.firstName = data.firstName.trim();
      }

      if (data.lastName !== undefined) {
        member.lastName = data.lastName.trim();
      }

      if (data.gender !== undefined) {
        member.gender = data.gender;
      }

      if (data.dob !== undefined) {
        member.dob = new Date(data.dob);
      }

      if (data.address !== undefined) {
        member.address = data.address.trim();
      }

      // Synchronize User account name.
      if (
        data.firstName !== undefined ||
        data.lastName !== undefined
      ) {
        user.name = `${member.firstName} ${member.lastName}`;
      }

      // Update fitness profile.
      const profile = await MemberProfile.findOne({
        memberId: member._id,
      }).session(session);

      const memberProfile =
        profile ?? new MemberProfile({ memberId: member._id });

      if (data.height !== undefined) {
        memberProfile.height = data.height;
      }

      if (data.weight !== undefined) {
        memberProfile.weight = data.weight;
      }

      if (data.fitnessGoal !== undefined) {
        memberProfile.fitnessGoal = data.fitnessGoal.trim();
      }

      if (data.medicalConditions !== undefined) {
        memberProfile.medicalConditions = data.medicalConditions;
      }

      // BMI formula: weight (kg) / height (metres)².
      if (memberProfile.height && memberProfile.weight) {
        const heightInMetres = memberProfile.height / 100;

        memberProfile.bmi = Number(
          (
            memberProfile.weight /
            (heightInMetres * heightInMetres)
          ).toFixed(2),
        );
      }

      await member.save({ session });
      await user.save({ session });
      await memberProfile.save({ session });

      return {
        member: member.toObject(),
        profile: memberProfile.toObject(),
      };
    });

    if (!result) {
      throw new Error('Member update could not be completed');
    }

    return result;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return fail(
        'A member with this email or mobile number already exists',
        409,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}



/**
 * Assign, transfer or remove a trainer from a member.
 *
 * Branch Admin / Reception:
 * Can manage members only in their assigned branch.
 *
 * Super Admin:
 * Can manage members across branches.
 */
export async function updateMemberTrainer(
  memberId: string,
  trainerId: string | null,
  actor: MemberActor,
) {
  // 1. Validate member ID
  if (!mongoose.isValidObjectId(memberId)) {
    return fail('Invalid member ID', 400);
  }

  // 2. Check actor permissions and branch scope
  const memberFilter: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(memberId),
  };

  if (
    actor.role === UserRole.BRANCH_ADMIN ||
    actor.role === UserRole.RECEPTION
  ) {
    const branchId = requireBranchId(actor.branchId);

    memberFilter.branchId = new mongoose.Types.ObjectId(
      branchId,
    );
  } else if (actor.role !== UserRole.SUPER_ADMIN) {
    return fail('Access denied', 403);
  }

  // 3. Find member
  const member = await Member.findOne(memberFilter);

  if (!member) {
    return fail('Member not found', 404);
  }

  // 4. If trainerId is null, remove current trainer
  if (trainerId === null) {
    member.trainerId = null;
    await member.save();

    return {
      member,
      message: 'Trainer removed successfully',
    };
  }

  // 5. Validate trainer ID
  if (!mongoose.isValidObjectId(trainerId)) {
    return fail('Invalid trainer ID', 400);
  }

  // 6. Find active trainer in the same branch
  const trainer = await User.findOne({
    _id: new mongoose.Types.ObjectId(trainerId),
    role: UserRole.TRAINER,
    branchId: String(member.branchId),
    isActive: true,
  }).select('_id name email mobile role branchId');

  if (!trainer) {
    return fail(
      'Active trainer not found in this member branch',
      400,
    );
  }

  // 7. Assign or transfer trainer
  member.trainerId = trainer._id;
  await member.save();

  return {
    member,
    message: 'Trainer assigned successfully',
  };
}


/**
 * Transfer a member from one branch to another.
 *
 * Super Admin only.
 * Updates Member.branchId and User.branchId atomically.
 */

/**
 * Transfer a member from one branch to another.
 *
 * Super Admin only.
 * Updates Member.branchId and User.branchId atomically.
 */
export async function transferMemberBranch(
  memberId: string,
  targetBranchId: string,
  actor: MemberActor,
): Promise<TransferMemberBranchResult> {
  // 1. Only Super Admin can transfer members.
  if (actor.role !== UserRole.SUPER_ADMIN) {
    return fail(
      'Only Super Admin can transfer members between branches',
      403,
    );
  }

  // 2. Validate IDs.
  if (!mongoose.isValidObjectId(memberId)) {
    return fail('Invalid member ID', 400);
  }

  if (!mongoose.isValidObjectId(targetBranchId)) {
    return fail('Invalid target branch ID', 400);
  }

  const memberObjectId = new mongoose.Types.ObjectId(memberId);
  const targetBranchObjectId = new mongoose.Types.ObjectId(
    targetBranchId,
  );

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction<TransferMemberBranchResult>(
      async () => {
        // 3. Find member.
        const member = await Member.findById(
          memberObjectId,
        ).session(session);

        if (!member) {
          return fail('Member not found', 404);
        }

        const previousBranchId = String(member.branchId);

        // 4. Prevent transfer to the same branch.
        if (previousBranchId === targetBranchId) {
          return fail(
            'Member already belongs to this branch',
            400,
          );
        }

        // 5. Verify target branch exists and is active.
        const targetBranch = await Branch.findOne({
          _id: targetBranchObjectId,
          isActive: true,
        }).session(session);

        if (!targetBranch) {
          return fail(
            'Target branch not found or inactive',
            400,
          );
        }

        // 6. Check duplicate mobile in target branch.
        const duplicateMobile = await Member.findOne({
          branchId: targetBranchObjectId,
          mobile: member.mobile,
          _id: { $ne: memberObjectId },
        }).session(session);

        if (duplicateMobile) {
          return fail(
            'A member with this mobile number already exists in the target branch',
            409,
          );
        }

        // 7. Find linked User account.
        const user = await User.findById(
          member.userId,
        ).session(session);

        if (!user) {
          return fail(
            'Linked user account not found for this member',
            404,
          );
        }

        // 8. Validate existing trainer.
        let trainerRemoved = false;

        if (member.trainerId) {
          const validTrainer = await User.findOne({
            _id: member.trainerId,
            role: UserRole.TRAINER,
            branchId: targetBranchId,
            isActive: true,
          }).session(session);

          if (!validTrainer) {
            member.trainerId = null;
            trainerRemoved = true;
          }
        }

        // 9. Update both branch references.
        member.branchId = targetBranchObjectId;
        user.branchId = targetBranchId;

        await member.save({ session });
        await user.save({ session });

        // 10. Return transaction result directly.
        return {
          member: member.toObject(),
          message: 'Member transferred successfully',
          previousBranchId,
          newBranchId: targetBranchId,
          trainerRemoved,
        };
      },
    );

    if (!result) {
      throw new Error(
        'Member branch transfer could not be completed',
      );
    }

    return result;
  } catch (error: unknown) {
    // Handle duplicate-key errors.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return fail(
        'A member with this mobile number already exists in the target branch',
        409,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
