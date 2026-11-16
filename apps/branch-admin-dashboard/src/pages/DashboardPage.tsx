import {
  UsersRound,
  UserCheck,
  UserPlus,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Clock3,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Members',
    value: '1,248',
    change: '+12.5%',
    positive: true,
    description: 'Compared to last month',
    icon: UsersRound,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Active Members',
    value: '986',
    change: '+8.2%',
    positive: true,
    description: 'Currently active memberships',
    icon: UserCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'New Registrations',
    value: '84',
    change: '+15.3%',
    positive: true,
    description: 'New members this month',
    icon: UserPlus,
    iconBg: 'bg-orange-50',
    iconColor: 'text-[#F4510B]',
  },
  {
    title: 'Monthly Revenue',
    value: '₹2,45,800',
    change: '-3.4%',
    positive: false,
    description: 'Compared to last month',
    icon: CreditCard,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
];

const recentActivities = [
  {
    name: 'New Member Registration',
    description: 'A new member registered at the branch.',
    time: 'Recently',
    icon: UserPlus,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'Membership Renewal',
    description: 'A membership renewal was recorded.',
    time: 'Today',
    icon: CreditCard,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    name: 'Attendance Updated',
    description: 'Member attendance was marked.',
    time: 'Today',
    icon: UserCheck,
    color: 'bg-orange-50 text-[#F4510B]',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Overview
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14243B]">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here's what's happening at your branch.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          <CalendarDays size={17} className="text-[#F4510B]" />
          Current Month
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.positive
            ? ArrowUpRight
            : ArrowDownRight;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon size={21} className={stat.iconColor} />
                </div>

                <span
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                    stat.positive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  <ChangeIcon size={13} />
                  {stat.change}
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14243B]">
                {stat.value}
              </h3>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Attendance Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#14243B]">
                Today's Attendance
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Daily branch attendance overview
              </p>
            </div>

            <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F4510B]">
              Today
            </span>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50/70 p-4">
              <p className="text-xs font-medium text-emerald-700">
                Present
              </p>
              <h4 className="mt-2 text-2xl font-extrabold text-emerald-700">
                742
              </h4>
            </div>

            <div className="rounded-xl bg-red-50/70 p-4">
              <p className="text-xs font-medium text-red-700">
                Absent
              </p>
              <h4 className="mt-2 text-2xl font-extrabold text-red-700">
                186
              </h4>
            </div>

            <div className="rounded-xl bg-blue-50/70 p-4">
              <p className="text-xs font-medium text-blue-700">
                Not Marked
              </p>
              <h4 className="mt-2 text-2xl font-extrabold text-blue-700">
                58
              </h4>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
              <span>Attendance Rate</span>
              <span>79.6%</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[79.6%] rounded-full bg-[#F4510B]" />
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-[#14243B]">
            Quick Summary
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Branch activity snapshot
          </p>

          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <UsersRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Total Trainers
                  </p>
                  <p className="text-xs text-slate-400">
                    Active staff
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#14243B]">
                18
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2.5 text-[#F4510B]">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Expiring Soon
                  </p>
                  <p className="text-xs text-slate-400">
                    Memberships
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#F4510B]">
                24
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Renewals
                  </p>
                  <p className="text-xs text-slate-400">
                    This month
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#14243B]">
                56
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#14243B]">
              Recent Activities
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Latest activity across your branch
            </p>
          </div>

          <span className="text-xs font-semibold text-[#F4510B]">
            Recent
          </span>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.name}
                className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.color}`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {activity.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activity.description}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
