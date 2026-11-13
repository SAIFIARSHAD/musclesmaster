import { Counter } from '../models/Counter.model';

export const generateInvoiceNumber = async (
  branchCode: string,
): Promise<string> => {
  if (!branchCode?.trim()) {
    throw new Error('Branch code is required for invoice generation.');
  }

  const currentYear = new Date().getFullYear();
  const normalizedBranchCode = branchCode.trim().toUpperCase();

  const counterId = `invoice:${normalizedBranchCode}:${currentYear}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    {
      $inc: { sequence: 1 },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!counter) {
    throw new Error('Unable to generate invoice number.');
  }

  const sequence = String(counter.sequence).padStart(6, '0');

  return `MM-INV-${normalizedBranchCode}-${currentYear}-${sequence}`;
};
