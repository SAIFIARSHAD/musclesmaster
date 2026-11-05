import mongoose from 'mongoose';
import { Counter } from '../models/Counter.model';
import { BranchSettings } from '../models/BranchSettings.model';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const MAX_COUNTER_RETRIES = 3;

function getYearAndMonth(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  if (!year || !month) {
    throw new Error('Unable to determine registration year and month');
  }

  return { year, month };
}

async function getNextSequence(
  counterKey: string,
  session: mongoose.ClientSession,
): Promise<number> {
  for (let attempt = 1; attempt <= MAX_COUNTER_RETRIES; attempt++) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { sequence: 1 } },
        {
          new: true,
          upsert: true,
          session,
        },
      );

      if (!counter) {
        throw new Error('Unable to generate member ID counter');
      }

      return counter.sequence;
    } catch (error: unknown) {
      const isDuplicateKeyError =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000;

      if (isDuplicateKeyError && attempt < MAX_COUNTER_RETRIES) {
        // Retry only for a duplicate-key race during initial creation.
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to generate member ID after retries');
}

export async function generateMemberId(
  branchId: string,
  session: mongoose.ClientSession,
): Promise<string> {
  if (!mongoose.isValidObjectId(branchId)) {
    throw Object.assign(
      new Error('A valid branch ID is required'),
      { statusCode: 400 },
    );
  }

  const branchSettings = await BranchSettings.findOne({ branchId })
    .select('timezone')
    .session(session)
    .lean();

  const timezone = branchSettings?.timezone || DEFAULT_TIMEZONE;

  let dateParts: { year: string; month: string };

  try {
    dateParts = getYearAndMonth(timezone);
  } catch {
    throw Object.assign(
      new Error(`Invalid or unsupported branch timezone: ${timezone}`),
      { statusCode: 400 },
    );
  }

  const { year, month } = dateParts;
  const counterKey = `MMA-${year}-${month}`;

  const sequence = await getNextSequence(counterKey, session);

  return `${counterKey}-${String(sequence).padStart(4, '0')}`;
}
