import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[#F4510B]" />
      </div>
    );
  }

  if (user?.role === 'RECEPTION') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to login. Please try again.';

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white">
      {/* Branding panel */}
      <section className="relative hidden w-1/2 overflow-hidden bg-[#14243B] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#F4510B]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4510B]">
            <Dumbbell size={26} />
          </div>

          <div>
            <h1 className="text-lg font-extrabold tracking-wider">
              MUSCLEMASTER AI
            </h1>
            <p className="text-xs font-semibold tracking-[0.2em] text-orange-200">
              GYM MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-xs font-bold tracking-wider text-orange-200">
            RECEPTION WORKSPACE
          </span>

          <h2 className="mt-7 text-4xl font-extrabold leading-tight xl:text-5xl">
            Your front desk.
            <span className="block text-[#F4510B]">
              Your gym operations.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
            Manage member registrations, attendance, memberships and
            everyday front desk activities from one place.
          </p>

          <div className="mt-10 flex items-center gap-3 text-sm text-slate-300">
            <ShieldCheck className="text-[#F4510B]" size={20} />
            Secure, branch-specific access
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} MusclesMaster AI. All rights reserved.
        </p>
      </section>

      {/* Login form */}
      <section className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#14243B] text-white">
              <Dumbbell size={23} />
            </div>

            <div>
              <h1 className="font-extrabold tracking-wider text-[#14243B]">
                MUSCLEMASTER AI
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-[#F4510B]">
                RECEPTION PORTAL
              </p>
            </div>
          </div>

          <div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
              <LockKeyhole size={26} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4510B]">
              Welcome Back
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#14243B]">
              Sign in to your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your Reception staff credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 text-sm font-bold text-white shadow-lg shadow-orange-950/10 transition hover:bg-[#dc4307] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-6 text-slate-400">
            Need access? Please contact your Branch Admin.
          </p>
        </div>
      </section>
    </main>
  );
}