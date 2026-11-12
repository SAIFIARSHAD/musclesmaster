
import mongoose from 'mongoose';
import QRCode from 'qrcode';

import { Member } from '../models/Member.model';
import { Branch } from '../models/Branch.model';
import { UserRole } from '../constants/roles.enum';
import { generateQrToken } from '../utils/qrGenerator';

export interface MemberQrActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

const fail = (message: string, statusCode = 400): never => {
  throw Object.assign(new Error(message), { statusCode });
};

export const generateMemberQr = async (
  memberId: string,
  actor: MemberQrActor,
) => {
  if (!mongoose.isValidObjectId(memberId)) {
    return fail('Invalid member ID.', 400);
  }

  if (
    ![
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_ADMIN,
      UserRole.RECEPTION,
    ].includes(actor.role)
  ) {
    return fail('You are not authorized to generate member QR.', 403);
  }

  const member = await Member.findById(memberId);

  if (!member) {
    return fail('Member not found.', 404);
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    (!actor.branchId || String(member.branchId) !== actor.branchId)
  ) {
    return fail(
      'You can generate QR only for members in your assigned branch.',
      403,
    );
  }

  const branch = await Branch.findOne({
    _id: member.branchId,
    isActive: true,
  });

  if (!branch) {
    return fail('Member branch is not active.', 400);
  }

  const { token, tokenHash } = generateQrToken();

  // Generate QR image containing the secure member token.
  const qrCodeDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
  });

  // Save only the hashed token in the database.
  member.qrTokenHash = tokenHash;
  await member.save();

  return {
    memberId: member.memberId,
    qrToken: token,
    qrCodeDataUrl,
    message: 'Member QR code generated successfully.',
  };
};
