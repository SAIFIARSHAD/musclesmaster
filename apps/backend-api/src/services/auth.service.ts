import { User } from '../models/User.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Contact administrator.');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const payload = {
    userId: String(user._id),
    role: user.role,
    branchId: user.branchId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    },
  };
};