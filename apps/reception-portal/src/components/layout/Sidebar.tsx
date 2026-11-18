import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  UserPlus,
  CalendarCheck,
  CreditCard,
  UserSearch,
  Wallet,
  Dumbbell,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    label: 'OVERVIEW',
    items: [
      { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'FRONT DESK',
    items: [
      { title: 'Members', path: '/members', icon: UsersRound },
      { title: 'Register Member', path: '/members/new', icon: UserPlus },
      { title: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { title: 'Memberships', path: '/memberships', icon: CreditCard },
    ],
  },
  {
    label: 'CUSTOMER MANAGEMENT',
    items: [
      { title: 'Leads & Inquiries', path: '/leads', icon: UserSearch },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { title: 'Payments', path: '/payments', icon: Wallet },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/10 bg-[#14243B] text-white transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4510B] text-white shadow-lg shadow-orange-950/30">
              <Dumbbell size={21} strokeWidth={2.3} />
            </div>

            <div>
              <p className="text-sm font-extrabold tracking-[0.11em]">
                MUSCLEMASTER
              </p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-orange-200/80">
                RECEPTION PORTAL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-7">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400/70">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard' || item.path === '/members'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-[#F4510B] text-white shadow-lg shadow-orange-950/25'
                            : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                        }`
                      }
                    >
                      <Icon size={19} strokeWidth={2} className="shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#F4510B]" />
              <p className="text-xs font-bold text-white">MusclesMaster AI</p>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Front Desk Workspace
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
