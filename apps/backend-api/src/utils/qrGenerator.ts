import { randomBytes, createHash } from 'crypto';

export interface GeneratedQrToken {
  token: string;
  tokenHash: string;
}

/**
 * Generates a secure QR token and its SHA-256 hash.
 * Store only tokenHash in the database.
 * Return token to the client for QR generation.
 */
export const generateQrToken = (): GeneratedQrToken => {
  const token = randomBytes(32).toString('hex');

  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex');

  return {
    token,
    tokenHash,
  };
};

/**
 * Hashes an existing QR token for database lookup.
 */
export const hashQrToken = (token: string): string => {
  return createHash('sha256')
    .update(token)
    .digest('hex');
};
