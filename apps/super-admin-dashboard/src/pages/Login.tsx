
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  Building2,
  Users,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api/auth.api';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Building2,
    title: 'Manage Branches',
    description: 'Oversee all gym branches from one place.',
  },
  {
    icon: Users,
    title: 'Manage Users',
    description: 'Control administrator and staff accounts.',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Get Insights',
    description: 'Monitor performance and growth.',
  },
];

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      const response = await loginApi(data);
      login(response.data.accessToken, response.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
      };

      setError(
        apiError.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  };

  return (
    <main className="grid h-dvh min-h-[600px] grid-cols-1 overflow-hidden bg-[#f7f8fa] lg:grid-cols-2">

      {/* LEFT PANEL */}
      <section
        className="relative hidden h-full overflow-hidden bg-[#07111d] text-white lg:flex lg:items-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(4,13,24,0.91), rgba(4,13,24,0.67)), url('/gym-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#07111d]/30 via-transparent to-[#07111d]/60" />

        <div className="relative z-10 mx-auto w-full max-w-2xl px-10 py-8 xl:px-14">

          {/* BRANDING */}
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

          {/* FEATURES */}
          <div className="space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="flex items-center gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <Icon className="h-6 w-6 text-[#F4510B]" />
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM INFO */}
          <div className="mt-9 rounded-xl border border-white/15 bg-[#07111d]/65 p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="w-1 shrink-0 rounded-full bg-[#F4510B]" />

              <div>
                <h3 className="text-[15px] font-bold">
                  Centralized Administration
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-slate-300">
                  A powerful platform to manage your gym business with complete
                  control and visibility.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-7 text-[10px] text-slate-400">
            © {new Date().getFullYear()} MusclesMaster AI. All rights reserved.
          </p>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="relative flex h-full items-center justify-center overflow-y-auto px-5 py-6 sm:px-10">

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

          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-[0_12px_45px_rgba(15,23,42,0.07)] sm:px-10 sm:py-10">

            <div className="mb-8">
              <h2 className="text-[30px] font-extrabold tracking-tight text-[#111827]">
                Welcome Back
              </h2>

              <p className="mt-2 text-[15px] text-slate-500">
                Sign in to your Super Admin account
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#111827]"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                    className="h-[52px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
                  />
                </div>

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#111827]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                    className="h-[52px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#F4510B]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* FORGOT PASSWORD */}
              <div className="-mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#F4510B] transition hover:text-[#d94308] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[54px] w-full items-center justify-center rounded-lg bg-[#F4510B] text-[15px] font-bold text-white shadow-md shadow-orange-600/15 transition hover:bg-[#df4508] focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs text-slate-400">
                Secure access to your gym management platform.
              </p>
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
