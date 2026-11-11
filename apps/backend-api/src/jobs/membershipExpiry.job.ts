
import cron from 'node-cron';
import mongoose from 'mongoose';

import {
  Membership,
  MembershipStatus,
} from '../models/Membership.model';

import {
  MembershipHistory,
  MembershipHistoryAction,
} from '../models/MembershipHistory.model';

import { BranchSettings } from '../models/BranchSettings.model';

import { autoUnfreezeMembership } from '../services/membershipFreeze.service';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Prevent overlapping cron executions.
let isJobRunning = false;

let membershipExpiryTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * Returns a YYYY-MM-DD date string for the given timezone.
 */
const getDateKey = (date: Date, timeZone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    // Fallback if the configured timezone is invalid.
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    return `${values.year}-${values.month}-${values.day}`;
  }
};

/**
 * Expires one membership safely.
 *
 * The status update and history creation happen in one transaction.
 * If another process has already changed the membership status,
 * this function will not create duplicate expiry history.
 */
const expireMembership = async (
  membershipId: mongoose.Types.ObjectId,
  timeZone: string,
): Promise<boolean> => {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const membership = await Membership.findOne({
        _id: membershipId,
        status: MembershipStatus.ACTIVE,
      }).session(session);

      if (!membership) {
        return false;
      }

      if (!membership.endDate) {
        return false;
      }

      const today = getDateKey(new Date(), timeZone);
      const endDate = getDateKey(
        new Date(membership.endDate),
        timeZone,
      );

      // endDate is inclusive.
      // Expire only when today's local date is after endDate.
      if (today <= endDate) {
        return false;
      }

      const updatedMembership = await Membership.findOneAndUpdate(
        {
          _id: membership._id,
          status: MembershipStatus.ACTIVE,
        },
        {
          $set: {
            status: MembershipStatus.EXPIRED,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedMembership) {
        return false;
      }

      await MembershipHistory.create(
        [
          {
            membershipId: membership._id,
            memberId: membership.memberId,
            branchId: membership.branchId,
            action: MembershipHistoryAction.EXPIRED,
            previousStatus: MembershipStatus.ACTIVE,
            newStatus: MembershipStatus.EXPIRED,
            notes: 'Membership automatically expired by system job.',
            metadata: {
              source: 'SYSTEM_JOB',
              expiredOn: new Date(),
              timezone: timeZone,
            },
          },
        ],
        { session },
      );

      return true;
    });

    return Boolean(result);
  } finally {
    await session.endSession();
  }
};

/**
 * Notification placeholder.
 * Actual email / WhatsApp / push notifications will be implemented in Week 10.
 */
const notifyMembershipExpired = async (
  membershipId: mongoose.Types.ObjectId,
): Promise<void> => {
  console.log(
    `[MembershipExpiry] Notification stub: membership ${membershipId} expired.`,
  );
};

/**
 * Process ACTIVE memberships whose inclusive end date has passed.
 */
const processMembershipExpiry = async (): Promise<void> => {
  const [activeMemberships, branchSettings] = await Promise.all([
    Membership.find({
      status: MembershipStatus.ACTIVE,
    })
      .select('_id branchId endDate')
      .lean(),

    BranchSettings.find()
      .select('branchId timezone')
      .lean(),
  ]);

  const timezoneMap = new Map<string, string>();

  for (const setting of branchSettings) {
    timezoneMap.set(
      setting.branchId.toString(),
      setting.timezone || DEFAULT_TIMEZONE,
    );
  }

  let expiredCount = 0;

  for (const membership of activeMemberships) {
    try {
      const timeZone =
        timezoneMap.get(membership.branchId.toString()) ||
        DEFAULT_TIMEZONE;

      const expired = await expireMembership(
        membership._id,
        timeZone,
      );

      if (expired) {
        expiredCount++;

        // Notification placeholder only.
        await notifyMembershipExpired(membership._id);
      }
    } catch (error) {
      console.error(
        `[MembershipExpiry] Failed to expire membership ${membership._id}:`,
        error,
      );
    }
  }

  console.log(
    `[MembershipExpiry] Expiry check completed. Expired: ${expiredCount}, Checked: ${activeMemberships.length}`,
  );
};

/**
 * Automatically unfreeze memberships whose freeze period has ended.
 */
const processDueUnfreezes = async (): Promise<void> => {
  const dueMemberships = await Membership.find({
    status: MembershipStatus.FROZEN,
    frozenAt: { $exists: true, $ne: null },
    freezeEndDate: { $lte: new Date() },
  })
    .select('_id')
    .lean();

  let unfreezeCount = 0;

  for (const membership of dueMemberships) {
    try {
      const unfrozen = await autoUnfreezeMembership(
        membership._id.toString(),
      );

      if (unfrozen) {
        unfreezeCount++;

        console.log(
          `[MembershipExpiry] Automatically unfrozen membership ${membership._id}`,
        );
      }
    } catch (error) {
      console.error(
        `[MembershipExpiry] Failed to unfreeze membership ${membership._id}:`,
        error,
      );
    }
  }

  console.log(
    `[MembershipExpiry] Auto-unfreeze check completed. Unfrozen: ${unfreezeCount}, Checked: ${dueMemberships.length}`,
  );
};

/**
 * Main job runner.
 * Exported so it can also be called directly from tests.
 */
export const runMembershipExpiryCheck = async (): Promise<void> => {
  if (isJobRunning) {
    console.log(
      '[MembershipExpiry] Previous job is still running. Skipping this execution.',
    );
    return;
  }

  isJobRunning = true;

  try {
    console.log('[MembershipExpiry] Job started.');

    await processDueUnfreezes();
    await processMembershipExpiry();

    console.log('[MembershipExpiry] Job completed.');
  } catch (error) {
    console.error('[MembershipExpiry] Job failed:', error);
  } finally {
    isJobRunning = false;
  }
};

/**
 * Start the scheduled job.
 *
 * Runs every 5 minutes so branches with different timezones
 * are checked shortly after their local midnight.
 */
export const startMembershipExpiryJob = (): void => {
  if (membershipExpiryTask) {
    console.log('[MembershipExpiry] Job is already running.');
    return;
  }

  membershipExpiryTask = cron.schedule(
    '*/5 * * * *',
    async () => {
      await runMembershipExpiryCheck();
    },
  );

  console.log(
    '[MembershipExpiry] Cron job scheduled. Interval: every 5 minutes.',
  );
};

/**
 * Stop the scheduled job.
 */
export const stopMembershipExpiryJob = (): void => {
  if (!membershipExpiryTask) {
    return;
  }

  membershipExpiryTask.stop();
  membershipExpiryTask = null;

  console.log('[MembershipExpiry] Cron job stopped.');
};
