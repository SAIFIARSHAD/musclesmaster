
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  Building2,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Dumbbell,
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UsersPage from './pages/Users';
import Branches from './pages/Branches';
import BranchSettings from './pages/BranchSettings';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import MemberProfile from './pages/MemberProfile';
import EditMember from './pages/EditMember';

import DashboardLayout from './components/layout/DashboardLayout';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F4510B]" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      title: 'Branch Management',
      description:
        'Create and manage gym branches, update branch details and control operational status.',
      path: '/branches',
      icon: Building2,
      label: 'Manage locations',
    },
    {
      title: 'User Management',
      description:
        'Manage administrators and platform users, assign roles and control account access.',
      path: '/users',
      icon: Users,
      label: 'Manage accounts',
    },
    {
      title: 'Member Management',
      description:
        'Register gym members, view member records and manage member information.',
      path: '/members',
      icon: Users,
      label: 'Manage members',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <section
        className="relative isolate overflow-hidden rounded-2xl bg-[#14243B] text-white shadow-lg shadow-slate-900/10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(13,29,49,0.96) 0%, rgba(20,36,59,0.90) 55%, rgba(20,36,59,0.68) 100%), url('/gym-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F4510B]/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:px-10 lg:py-9">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-orange-200">
              <ShieldCheck size={14} className="text-[#F4510B]" />
              SUPER ADMIN WORKSPACE
            </div>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-[34px]">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px] sm:leading-7">
              Your central workspace to manage gym branches, user accounts
              and platform administration.
            </p>

            <div className="mt-6 h-1 w-14 rounded-full bg-[#F4510B]" />
          </div>

          <div className="hidden shrink-0 items-center justify-center lg:flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-orange-300/20 bg-white/[0.08] text-[#F4510B] shadow-xl backdrop-blur-sm">
              <Dumbbell size={46} strokeWidth={1.7} />
            </div>
          </div>
        </div>
      </section>

      {/* Management Modules */}
      <section>
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F4510B]">
            Workspace
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-[#14243B]">
            Management Modules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose a module to manage your organization.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.path}
                type="button"
                onClick={() => navigate(module.path)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-950/5 sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#F4510B] transition group-hover:border-orange-200 group-hover:bg-[#F4510B] group-hover:text-white">
                    <Icon size={23} strokeWidth={2} />
                  </div>

                  <div className="rounded-lg p-2 text-slate-300 transition group-hover:bg-orange-50 group-hover:text-[#F4510B]">
                    <ArrowUpRight size={19} />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-bold text-[#14243B] transition group-hover:text-[#F4510B]">
                  {module.title}
                </h3>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                  {module.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-[#F4510B]">
                    {module.label}
                  </span>

                  <span className="text-xs font-medium text-slate-400 transition group-hover:text-[#F4510B]">
                    Open module →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Platform Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#F4510B]">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h3 className="font-bold text-[#14243B]">
              Centralized Administration
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Use the navigation menu to access available management
              modules. Additional modules will become available as
              development progresses.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branches" element={<Branches />} />
          <Route
            path="/branches/:id/settings"
            element={<BranchSettings />}
          />
          <Route path="/users" element={<UsersPage />} />

          {/* Member Management */}
          <Route path="/members" element={<Members />} />
          <Route path="/members/new" element={<AddMember />} />
          <Route path="/members/:memberId" element={<MemberProfile />} />
          <Route path="/members/:memberId/edit"element={<EditMember />}/>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
