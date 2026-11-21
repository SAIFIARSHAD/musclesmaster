
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  LockKeyhole,
  Eye,
  EyeOff,
  Dumbbell,
  ShieldCheck,
  Activity,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
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
        err instanceof Error ? err.message : 'Unable to process request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
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
        err instanceof Error ? err.message : 'OTP verification failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
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
        err instanceof Error ? err.message : 'Unable to reset password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: 'EMAIL', label: 'Email', number: '01' },
    { key: 'OTP', label: 'Verification', number: '02' },
    { key: 'RESET', label: 'New Password', number: '03' },
  ];

  const activeStepIndex = steps.findIndex((item) => item.key === step);

  const heading = {
    EMAIL: 'Forgot your password?',
    OTP: 'Verify your identity',
    RESET: 'Create new password',
    SUCCESS: 'Password updated!',
  }[step];

  const description = {
    EMAIL: 'No worries. Enter your registered email address and we will send you a verification code.',
    OTP: 'Enter the 6-digit verification code sent to your registered email address.',
    RESET: 'Choose a strong password to keep your account secure.',
    SUCCESS: 'Your password has been changed successfully. You can now sign in with your new password.',
  }[step];

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-[#F4510B]/10';

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggleVisibility: () => void,
    placeholder: string,
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} pr-12`}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#F4510B]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:grid lg:grid-cols-[1fr_1fr]">

      {/* Left Branding Panel */}
      <div className="relative hidden min-h-screen overflow-hidden bg-[#14243B] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">

        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-32 h-[450px] w-[450px] rounded-full border border-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4510B] shadow-lg shadow-orange-900/30">
            <Dumbbell size={25} strokeWidth={2.5} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-[0.12em]">
              MUSCLEMASTER
            </h2>
            <p className="text-xs tracking-wider text-slate-400">
              AI GYM MANAGEMENT
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-orange-300">
            <ShieldCheck size={15} />
            Secure Account Recovery
          </div>

          <h1 className="text-4xl font-bold leading-[1.2] xl:text-5xl">
            Your account,
            <br />
            your control.
            <br />
            <span className="text-[#F4510B]">
              Stay connected.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
            Recover your account securely and get back to managing your gym
            operations without interruption.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                <ShieldCheck size={21} />
              </div>
              <div>
                <p className="font-semibold">Secure verification</p>
                <p className="mt-1 text-sm text-slate-400">
                  OTP-based identity verification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                <LockKeyhole size={21} />
              </div>
              <div>
                <p className="font-semibold">Password protection</p>
                <p className="mt-1 text-sm text-slate-400">
                  Create a new secure password
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                <Activity size={21} />
              </div>
              <div>
                <p className="font-semibold">Back to business</p>
                <p className="mt-1 text-sm text-slate-400">
                  Continue managing your branch
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} MusclesMaster AI</span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Secure Admin Portal
          </span>
        </div>
      </div>

      {/* Right Recovery Panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

        <div className="w-full max-w-[480px]">

          {/* Mobile Branding */}
          <div className="mb-9 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4510B] text-white">
              <Dumbbell size={23} />
            </div>
            <div>
              <h2 className="font-extrabold tracking-wider text-[#14243B]">
                MUSCLEMASTER
              </h2>
              <p className="text-[10px] tracking-widest text-slate-500">
                AI GYM MANAGEMENT
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">

            {/* Header */}
            <div className="mb-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
                {step === 'EMAIL' && <Mail size={25} />}
                {step === 'OTP' && <KeyRound size={25} />}
                {step === 'RESET' && <LockKeyhole size={25} />}
                {step === 'SUCCESS' && <CheckCircle2 size={27} />}
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#F4510B]">
                Account Recovery
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#14243B] sm:text-[28px]">
                {heading}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            {/* Step Indicator */}
            {step !== 'SUCCESS' && (
              <div className="mb-7">
                <div className="mb-3 flex items-center justify-between">
                  {steps.map((item, index) => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 text-xs font-semibold ${
                        index <= activeStepIndex
                          ? 'text-[#14243B]'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${
                          index < activeStepIndex
                            ? 'bg-[#14243B] text-white'
                            : index === activeStepIndex
                              ? 'bg-[#F4510B] text-white'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {index < activeStepIndex ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          item.number.slice(1)
                        )}
                      </span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#F4510B] transition-all duration-500"
                    style={{
                      width: `${((activeStepIndex + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email Message */}
            {message && step === 'OTP' && (
              <div className="mb-5 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
                <Mail size={18} className="mt-0.5 shrink-0" />
                <p>{message}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* EMAIL STEP */}
            {step === 'EMAIL' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Registered Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#DC4307] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP STEP */}
            {step === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="recovery-otp"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Verification Code
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="recovery-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="Enter 6-digit OTP"
                      className={`${inputClass} tracking-[0.35em]`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Verification code sent to{' '}
                    <span className="font-semibold text-[#14243B]">
                      {email}
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#DC4307] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setOtp('');
                    setError('');
                    setMessage('');
                  }}
                  className="w-full text-sm font-semibold text-[#14243B] transition hover:text-[#F4510B]"
                >
                  Change email address
                </button>
              </form>
            )}

            {/* RESET PASSWORD STEP */}
            {step === 'RESET' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {renderPasswordInput(
                  'new-password',
                  'New Password',
                  newPassword,
                  setNewPassword,
                  showPassword,
                  () => setShowPassword(!showPassword),
                  'Minimum 8 characters',
                )}

                {renderPasswordInput(
                  'confirm-password',
                  'Confirm New Password',
                  confirmPassword,
                  setConfirmPassword,
                  showConfirmPassword,
                  () => setShowConfirmPassword(!showConfirmPassword),
                  'Re-enter your password',
                )}

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#F4510B]" />
                  Use at least 8 characters for your new password.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#DC4307] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SUCCESS STEP */}
            {step === 'SUCCESS' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={30} />
                  </div>

                  <h3 className="font-bold text-green-800">
                    Password Changed Successfully
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-green-700">
                    Your account is now ready to use with your new password.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#DC4307]"
                >
                  Back to Login
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {/* Back to Login */}
            {step !== 'SUCCESS' && (
              <Link
                to="/login"
                className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>Secure Branch Administration Portal</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
