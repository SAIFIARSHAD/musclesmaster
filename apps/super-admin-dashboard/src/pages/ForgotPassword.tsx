import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';
import { forgotPasswordApi } from '../api/auth.api';

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setMessage('');
    setError('');

    try {
      const email = data.email.trim().toLowerCase();

      await forgotPasswordApi({ email });

      setMessage(
        'If an account exists for this email, password reset instructions will be sent.'
      );

      window.setTimeout(() => {
        navigate('/reset-password', {
          state: { email },
        });
      }, 1200);
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        apiError.response?.data?.message ||
          'Unable to process your request. Please try again.'
      );
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
                  Account Security
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Securely recover access to your MusclesMaster AI
                  administration account.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-[10px] text-slate-400">
            © {new Date().getFullYear()} MusclesMaster AI. All rights reserved.
          </p>
        </div>
      </section>

      {/* RIGHT FORM PANEL */}
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:min-h-0 lg:overflow-y-auto">
        {/* Mobile branding */}
        <div className="absolute left-0 right-0 top-0 bg-[#101d2b] px-5 py-5 text-center lg:hidden">
          <h1 className="text-xl font-extrabold text-white">
            MusclesMaster <span className="text-[#F4510B]">AI</span>
          </h1>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-slate-300">
            ADMIN CONSOLE
          </p>
        </div>

        <div className="w-full max-w-[510px] pt-20 lg:pt-0">
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-9 shadow-[0_12px_45px_rgba(15,23,42,0.07)] sm:px-10 sm:py-11">

            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <ShieldCheck className="h-7 w-7 text-[#F4510B]" />
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#F4510B]">
                MusclesMaster AI
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">
                Forgot Password?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your registered email address. We'll help you
                securely reset your password.
              </p>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#111827]"
                >
                  Registered Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? 'email-error' : undefined
                    }
                    {...register('email')}
                    className="h-[54px] w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
                  />
                </div>

                {errors.email && (
                  <p id="email-error" className="mt-2 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#F4510B] px-4 text-sm font-bold text-white shadow-md shadow-orange-600/15 transition hover:bg-[#df4508] focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Your account security matters. Never share your OTP or password
              with anyone.
            </p>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} MusclesMaster AI
          </p>
        </div>
      </section>
    </main>
  );
}
