import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { verifyOtpApi, resetPasswordApi } from '../api/auth.api';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const resetSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';

  const [otpVerified, setOtpVerified] = React.useState(false);
  const [verifiedToken, setVerifiedToken] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: emailFromState },
  });

  const handleVerifyOtp = async () => {
    setError('');
    setMessage('');

    const valid = await trigger(['email', 'otp']);
    if (!valid) return;

    try {
      setIsVerifying(true);

      const response = await verifyOtpApi({
        email: getValues('email'),
        otp: getValues('otp'),
      });

      const token = response.data?.data?.verifiedToken;

      if (!token) {
        throw new Error('Verified token was not received from server');
      }

      setVerifiedToken(token);
      setOtpVerified(true);
      setMessage('OTP verified successfully. You can now set a new password.');
    } catch (err: any) {
      setOtpVerified(false);
      setVerifiedToken('');
      setError(
        err.response?.data?.message ||
          err.message ||
          'Invalid or expired OTP'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: ResetFormData) => {
    if (!otpVerified || !verifiedToken) {
      setError('Please verify the OTP first.');
      return;
    }

    try {
      setError('');
      setMessage('');
     await resetPasswordApi({
  verifiedToken,
  newPassword: data.newPassword,
  confirmPassword: data.confirmPassword,
});
      setMessage('Password reset successful. Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-md p-8 bg-[#1a1a1a] rounded-xl border border-[#333]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          MusclesMaster AI
        </h1>
        <h2 className="text-lg text-gray-300 mb-6 text-center">
          Reset Password
        </h2>

        {message && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              disabled={otpVerified}
              className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded text-white disabled:opacity-60 focus:outline-none focus:border-orange-500"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 mb-2">OTP</label>
            <div className="flex gap-2">
              <input
                {...register('otp')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                disabled={otpVerified}
                placeholder="Enter 6-digit OTP"
                className="min-w-0 flex-1 px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded text-white disabled:opacity-60 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpVerified}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : otpVerified ? 'Verified' : 'Verify OTP'}
              </button>
            </div>
            {errors.otp && (
              <p className="text-red-400 text-sm mt-1">{errors.otp.message}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                disabled={!otpVerified}
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-12 bg-[#0d0d0d] border border-[#333] rounded text-white disabled:opacity-50 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={!otpVerified}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-sm mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                disabled={!otpVerified}
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-12 bg-[#0d0d0d] border border-[#333] rounded text-white disabled:opacity-50 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                disabled={!otpVerified}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!otpVerified || isSubmitting}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-orange-500 hover:text-orange-400 text-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}