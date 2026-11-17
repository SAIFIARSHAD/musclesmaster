
import {
  CalendarCheck,
  UsersRound,
  UserPlus,
  Wallet,
  CreditCard,
  Clock,
  UserCheck,
  TrendingUp,
  QrCode,
  LogIn,
  LogOut,
  ArrowUpRight,
  Search,
  RefreshCw,
  UserRound,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const stats = [
  {
    title: "Today's Check-ins",
    value: '—',
    description: 'Daily attendance records',
    icon: CalendarCheck,
  },
  {
    title: 'Total Visits Today',
    value: '—',
    description: 'Total gym visits',
    icon: UsersRound,
  },
  {
    title: 'New Registrations',
    value: '—',
    description: 'Members registered today',
    icon: UserPlus,
  },
  {
    title: "Today's Collections",
    value: '—',
    description: 'Payments collected today',
    icon: Wallet,
  },
  {
    title: 'Pending / Due Payments',
    value: '—',
    description: 'Outstanding payment amount',
    icon: CreditCard,
  },
  {
    title: 'Expiring Memberships',
    value: '—',
    description: 'Memberships expiring soon',
    icon: Clock,
  },
  {
    title: 'Currently Inside Gym',
    value: '—',
    description: 'Members currently checked in',
    icon: UserCheck,
  },
];

const quickActions = [
  {
    title: 'Add New Member',
    description: 'Register a new gym member',
    icon: UserPlus,
    path: '/members/new',
  },
  {
    title: 'Scan Member QR',
    description: 'Scan member QR for attendance',
    icon: QrCode,
    path: '/attendance',
  },
  {
    title: 'Manual Check-in',
    description: 'Record member entry manually',
    icon: LogIn,
    path: '/attendance',
  },
  {
    title: 'Manual Check-out',
    description: 'Record member exit manually',
    icon: LogOut,
    path: '/attendance',
  },
  {
    title: 'Collect Payment',
    description: 'Open payment collection',
    icon: Wallet,
    path: '/payments',
  },
  {
    title: 'Renew Membership',
    description: 'Manage member renewals',
    icon: RefreshCw,
    path: '/memberships',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#14243B] text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F4510B]/20 blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:px-10 lg:py-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-orange-200">
            <span className="h-2 w-2 rounded-full bg-[#F4510B]" />
            RECEPTION WORKSPACE
          </div>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome to MusclesMaster AI!
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Manage your daily front desk operations, monitor gym
            activity and keep track of member visits.
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-orange-200">
            <TrendingUp size={16} />
            Daily Operations Overview
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section>
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F4510B]">
            Performance Overview
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-[#14243B]">
            Today's Gym Statistics
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor check-ins, registrations, collections and memberships.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-950/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B] transition group-hover:bg-[#F4510B] group-hover:text-white">
                    <Icon size={22} />
                  </div>

                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                    Today
                  </span>
                </div>

                <h3 className="mt-5 text-3xl font-extrabold tracking-tight text-[#14243B]">
                  {stat.value}
                </h3>

                <p className="mt-1 text-sm font-bold text-[#14243B]">
                  {stat.title}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F4510B]">
            Quick Access
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-[#14243B]">
            Front Desk Operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly access your everyday reception activities.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.path)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-950/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#F4510B] transition group-hover:bg-[#F4510B] group-hover:text-white">
                    <Icon size={22} />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-slate-300 transition group-hover:text-[#F4510B]"
                  />
                </div>

                <h3 className="mt-5 font-bold text-[#14243B] group-hover:text-[#F4510B]">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Activity Sections */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Recent Check-ins */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="font-extrabold text-[#14243B]">
                Recent Check-ins
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Latest member attendance activity
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-1 text-xs font-bold text-[#F4510B] hover:underline"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="p-5">
            <div className="flex flex-col items-center justify-center py-9 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
                <CalendarCheck size={25} />
              </div>

              <h4 className="mt-4 text-sm font-bold text-[#14243B]">
                No attendance records available
              </h4>

              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
                Recent member check-ins will appear here once attendance
                data is connected.
              </p>
            </div>
          </div>
        </div>

        {/* Currently Inside */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="font-extrabold text-[#14243B]">
                Currently Inside Gym
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Members currently present in your branch
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-1 text-xs font-bold text-[#F4510B] hover:underline"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="p-5">
            <div className="flex flex-col items-center justify-center py-9 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserRound size={25} />
              </div>

              <h4 className="mt-4 text-sm font-bold text-[#14243B]">
                No members currently displayed
              </h4>

              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
                Currently checked-in members will appear here after
                attendance API integration.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Dashboard Footer */}
      <section className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#F4510B]">
          <Search size={21} />
        </div>

        <div>
          <h3 className="font-bold text-[#14243B]">
            Live dashboard data
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Attendance, member registration and payment statistics will
            appear here after dashboard API integration.
          </p>
        </div>
      </section>

    </div>
  );
}
