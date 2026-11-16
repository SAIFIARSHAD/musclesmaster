import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, LockKeyhole } from 'lucide-react';

import {
  forgotPasswordApi,
  verifyOtpApi,
  resetPasswordApi,
} from '../api/auth.api';

type RecoveryStep = 'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<RecoveryStep>('EMAIL');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await forgotPasswordApi({
        email: email.trim(),
      });

      setMessage(response.message);
      setStep('OTP');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to process request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await verifyOtpApi({
        email: email.trim(),
        otp: otp.trim(),
      });

      const token = response.data?.verifiedToken;

      if (!token) {
        throw new Error('Verification token was not received.');
      }

      setVerifiedToken(token);
      setStep('RESET');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'OTP verification failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPasswordApi({
        verifiedToken,
        newPassword,
        confirmPassword,
      });

      setStep('SUCCESS');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = {
    EMAIL: 'Forgot password?',
    OTP: 'Verify your OTP',
    RESET: 'Create new password',
    SUCCESS: 'Password reset successful',
  }[step];

  const description = {
    EMAIL: 'Enter your registered email to receive a password reset OTP.',
    OTP: 'Enter the OTP sent to your registered email address.',
    RESET: 'Create a strong password for your account.',
    SUCCESS: 'Your password has been updated successfully.',
  }[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">

        <div className="mb-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {step === 'EMAIL' && <Mail size={23} />}
            {step === 'OTP' && <KeyRound size={23} />}
            {step === 'RESET' && <LockKeyhole size={23} />}
            {step === 'SUCCESS' && <LockKeyhole size={23} />}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {heading}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {message && step === 'OTP' && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {step === 'EMAIL' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>

              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label htmlFor="recovery-otp" className="mb-2 block text-sm font-medium text-slate-700">
                Enter OTP
              </label>

              <input
                id="recovery-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm tracking-[0.3em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('EMAIL');
                setOtp('');
                setError('');
                setMessage('');
              }}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Change email address
            </button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-700">
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <Link
            to="/login"
            className="block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
          >
            Back to Login
          </Link>
        )}

        {step !== 'SUCCESS' && (
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
