
import axios from 'axios';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  UsersRound,
  Activity,
  Loader2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let message = 'Unable to login. Please try again.';

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F6FA] lg:grid lg:grid-cols-2">

      {/* Left Branding Section */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#14243B] p-10 text-white lg:flex xl:p-14">

        {/* Background Decorations */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[350px] w-[350px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[550px] w-[550px] rounded-full border border-white/[0.06]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4510B] shadow-lg shadow-orange-950/30">
            <Dumbbell size={26} strokeWidth={2.4} />
          </div>

          <div>
            <h1 className="text-lg font-extrabold tracking-[0.12em]">
              MUSCLEMASTER
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-[0.25em] text-orange-200">
              AI FITNESS MANAGEMENT
            </p>
          </div>
        </div>

        <div className="relative z-10 my-14 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-bold tracking-wider text-orange-300">
            <Activity size={14} />
            BRANCH MANAGEMENT CONSOLE
          </span>

          <h2 className="mt-7 text-4xl font-extrabold leading-[1.2] tracking-tight xl:text-5xl">
            Manage your gym.
            <span className="mt-2 block text-[#F4510B]">
              Empower your team.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
            Your central workspace to manage members, memberships,
            attendance and your branch operations — all in one place.
          </p>

          <div className="mt-12 space-y-5">
            {[
              {
                icon: UsersRound,
                title: 'Member Management',
                description: 'Keep your member records organized.',
              },
              {
                icon: Activity,
                title: 'Attendance Tracking',
                description: 'Monitor daily gym visits and activity.',
              },
              {
                icon: ShieldCheck,
                title: 'Branch Control',
                description: 'Manage your team with secure access.',
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-[#F4510B]">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MusclesMaster AI
          </p>
          <p className="text-xs font-medium text-slate-400">
            Built for smarter fitness operations
          </p>
        </div>
      </section>

      {/* Right Login Section */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

        <div className="w-full max-w-[440px]">

          {/* Mobile Branding */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4510B] text-white shadow-lg shadow-orange-900/20">
              <Dumbbell size={25} strokeWidth={2.4} />
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-[0.1em] text-[#14243B]">
                MUSCLEMASTER
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#F4510B]">
                AI FITNESS MANAGEMENT
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
              <LockKeyhole size={23} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4510B]">
              Branch Admin Portal
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14243B] sm:text-4xl">
              Welcome back
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to access your branch management dashboard.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_15px_50px_rgba(20,36,59,0.07)] sm:p-9">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-[#14243B]"
                >
                  Email Address
                </label>

                <div className="group relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#F4510B]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#14243B] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-[#14243B]"
                  >
                    Password
                  </label>
                </div>

                <div className="group relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#F4510B]"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-[#14243B] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#F4510B]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-[#F4510B] transition hover:text-[#d94308]"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#dc4508] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400">
              <ShieldCheck size={15} className="text-emerald-600" />
              Secure access to your branch dashboard
            </div>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            MusclesMaster AI · Branch Management System
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
