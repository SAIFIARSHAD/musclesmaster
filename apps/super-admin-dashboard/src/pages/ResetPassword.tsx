
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  forgotPasswordApi,
  verifyOtpApi,
  resetPasswordApi,
} from '../api/auth.api';

const resetSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address'),
    otp: z.string().regex(/^\d{6}$/, 'OTP must contain exactly 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetFormData = z.infer<typeof resetSchema>;

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || apiError.message || fallback;
};

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState =
    (location.state as { email?: string } | null)?.email ?? '';

  const [otpVerified, setOtpVerified] = React.useState(false);
  const [verifiedToken, setVerifiedToken] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resetComplete, setResetComplete] = React.useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: emailFromState,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerifyOtp = async () => {
    setError('');
    setMessage('');

    const valid = await trigger(['email', 'otp']);
    if (!valid) return;

    try {
      setIsVerifying(true);

      const response = await verifyOtpApi({
        email: getValues('email').trim().toLowerCase(),
        otp: getValues('otp'),
      });

      const token = response.data?.data?.verifiedToken;

      if (!token) {
        throw new Error('Verification token was not received from the server.');
      }

      setVerifiedToken(token);
      setOtpVerified(true);
      setMessage('OTP verified successfully. You can now set a new password.');
    } catch (err: unknown) {
      setOtpVerified(false);
      setVerifiedToken('');
      setError(getErrorMessage(err, 'Invalid or expired OTP.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');

    const emailValid = await trigger('email');
    if (!emailValid) return;

    try {
      setIsResending(true);

      const email = getValues('email').trim().toLowerCase();
      await forgotPasswordApi({ email });

      setValue('otp', '');
      setOtpVerified(false);
      setVerifiedToken('');
      setResendCooldown(30);

      setMessage(
        'If an account exists for this email, a new OTP has been requested. Check your inbox.'
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to request a new OTP.'));
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetFormData) => {
    setError('');
    setMessage('');

    if (!otpVerified || !verifiedToken) {
      setError('Please verify your OTP before resetting your password.');
      return;
    }

    try {
      await resetPasswordApi({
        verifiedToken,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setResetComplete(true);
      setMessage('Your password has been reset successfully.');

      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Password reset failed. Please try again.'));
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f8fa] lg:h-dvh lg:min-h-[600px] lg:grid-cols-2 lg:overflow-hidden">

      {/* LEFT BRAND PANEL */}
      <section
        className="relative hidden overflow-hidden bg-[#07111d] text-white lg:flex lg:items-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(4,13,24,0.91), rgba(4,13,24,0.67)), url('/gym-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-2xl px-10 py-8 xl:px-14">
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-300">
              Welcome to
            </p>

            <div className="mb-4 mt-4 h-[3px] w-14 rounded-full bg-[#F4510B]" />

            <h1 className="text-[clamp(32px,3.4vw,48px)] font-extrabold leading-tight tracking-tight">
              MusclesMaster <span className="text-[#F4510B]">AI</span>
            </h1>

            <p className="mt-2 text-sm font-semibold tracking-[0.38em] text-slate-300">
              ADMIN CONSOLE
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-[#07111d]/65 p-5 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="w-1 shrink-0 rounded-full bg-[#F4510B]" />

              <div>
                <h2 className="text-base font-bold">
                  Secure Account Recovery
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Verify your identity and securely restore access to your
                  MusclesMaster AI administration account.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-[10px] text-slate-400">
            © {new Date().getFullYear()} MusclesMaster AI. All rights reserved.
          </p>
        </div>
      </section>

      {/* RIGHT RESET PANEL */}
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:min-h-0 lg:overflow-y-auto">

        {/* MOBILE BRANDING */}
        <div className="absolute left-0 right-0 top-0 bg-[#101d2b] px-5 py-5 text-center lg:hidden">
          <h1 className="text-xl font-extrabold text-white">
            MusclesMaster <span className="text-[#F4510B]">AI</span>
          </h1>

          <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-slate-300">
            ADMIN CONSOLE
          </p>
        </div>

        <div className="w-full max-w-[510px] pt-20 lg:pt-0">
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-[0_12px_45px_rgba(15,23,42,0.07)] sm:px-10 sm:py-9">

            {/* HEADER */}
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                {resetComplete ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                ) : otpVerified ? (
                  <KeyRound className="h-7 w-7 text-[#F4510B]" />
                ) : (
                  <ShieldCheck className="h-7 w-7 text-[#F4510B]" />
                )}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#F4510B]">
                MusclesMaster AI
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                {resetComplete
                  ? 'Password Updated'
                  : otpVerified
                    ? 'Create New Password'
                    : 'Verify Your Email'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {resetComplete
                  ? 'Your password has been updated successfully. Redirecting you to login...'
                  : otpVerified
                    ? 'Choose a strong password that you have not used before.'
                    : 'Enter the 6-digit OTP sent to your registered email address.'}
              </p>
            </div>

            {/* SUCCESS MESSAGE */}
            {message && (
              <div
                role="status"
                aria-live="polite"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700"
              >
                {message}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            {!resetComplete && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#111827]"
                  >
                    Registered Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      disabled={otpVerified || isSubmitting || isVerifying}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                      {...register('email')}
                      className="h-[50px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:bg-slate-50 disabled:opacity-70"
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* OTP VERIFICATION */}
                {!otpVerified && (
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-sm font-semibold text-[#111827]"
                    >
                      Email Verification Code
                    </label>

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      disabled={isVerifying || isResending}
                      aria-invalid={Boolean(errors.otp)}
                      {...register('otp', {
                        onChange: (event) => {
                          const digits = event.target.value
                            .replace(/\D/g, '')
                            .slice(0, 6);

                          setValue('otp', digits, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });
                        },
                      })}
                      className="h-[54px] w-full rounded-lg border border-slate-300 bg-white px-4 text-center text-lg font-semibold tracking-[0.4em] text-slate-800 outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:bg-slate-50"
                    />

                    {errors.otp && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.otp.message}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || isResending || isSubmitting}
                      className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-[#F4510B] px-4 text-sm font-bold text-white shadow-md shadow-orange-600/15 transition hover:bg-[#df4508] focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifying && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}

                      {isVerifying ? 'Verifying OTP...' : 'Verify OTP'}
                    </button>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={
                          isResending ||
                          isVerifying ||
                          resendCooldown > 0
                        }
                        className="text-sm font-semibold text-[#F4510B] transition hover:text-[#d94308] disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {isResending
                          ? 'Requesting new OTP...'
                          : resendCooldown > 0
                            ? `Resend OTP in ${resendCooldown}s`
                            : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {/* NEW PASSWORD */}
                {otpVerified && (
                  <>
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="mb-2 block text-sm font-semibold text-[#111827]"
                      >
                        New Password
                      </label>

                      <div className="relative">
                        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          placeholder="At least 8 characters"
                          {...register('newPassword')}
                          className="h-[50px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          disabled={isSubmitting}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#F4510B]"
                        >
                          {showPassword ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>
                      </div>

                      {errors.newPassword && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-semibold text-[#111827]"
                      >
                        Confirm New Password
                      </label>

                      <div className="relative">
                        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          placeholder="Re-enter your new password"
                          {...register('confirmPassword')}
                          className="h-[50px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          disabled={isSubmitting}
                          aria-label={
                            showConfirmPassword
                              ? 'Hide confirmation password'
                              : 'Show confirmation password'
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#F4510B]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>
                      </div>

                      {errors.confirmPassword && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* RESET BUTTON */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[#F4510B] px-4 text-sm font-bold text-white shadow-md shadow-orange-600/15 transition hover:bg-[#df4508] focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting && (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      )}

                      {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* BACK TO LOGIN */}
            <div className="mt-7 border-t border-slate-100 pt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} MusclesMaster AI
          </p>
        </div>
      </section>
    </main>
  );
}
