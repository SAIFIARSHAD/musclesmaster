
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  CreditCard,
  ChartNoAxesCombined,
  Settings,
  Dumbbell,
  ChevronLeft,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navigation = [
  {
    label: 'OVERVIEW',
    items: [
      { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { title: 'Branches', path: '/branches', icon: Building2 },
      { title: 'Users', path: '/users', icon: Users },
      { title: 'Members', path: '/members', icon: UsersRound },
      { title: 'Memberships', path: '/memberships', icon: CreditCard, upcoming: true },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { title: 'Reports', path: '/reports', icon: ChartNoAxesCombined, upcoming: true },
      { title: 'Settings', path: '/settings', icon: Settings, upcoming: true },
    ],
  },
];

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#14243B] text-white transition-all duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'w-[264px] lg:w-[84px]' : 'w-[264px]'}`}
      >
        {/* Brand */}
        <div
          className={`flex h-[76px] shrink-0 items-center border-b border-white/10 ${
            collapsed ? 'justify-center px-3' : 'justify-between px-5'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4510B] text-white shadow-lg shadow-orange-950/30">
              <Dumbbell size={21} strokeWidth={2.3} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold tracking-[0.11em] text-white">
                  MUSCLEMASTER
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-orange-200/70">
                  ADMIN CONSOLE
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={19} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-7">
          {navigation.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400/70">
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (item.upcoming) {
                    return (
                      <div
                        key={item.title}
                        title={`${item.title} — coming soon`}
                        className={`flex cursor-not-allowed items-center rounded-xl py-3 text-sm text-slate-400/45 ${
                          collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                        }`}
                      >
                        <Icon size={19} strokeWidth={1.9} />

                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400/70">
                              Soon
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard'}
                      onClick={onClose}
                      title={collapsed ? item.title : undefined}
                      className={({ isActive }) =>
                        `group flex items-center rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                          collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                        } ${
                          isActive
                            ? 'bg-[#F4510B] text-white shadow-lg shadow-orange-950/25'
                            : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                        }`
                      }
                    >
                      <Icon
                        size={19}
                        strokeWidth={2}
                        className="shrink-0"
                      />

                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-white/10 p-4">
          {!collapsed ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F4510B]" />
                <p className="text-xs font-bold text-white">
                  MusclesMaster AI
                </p>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Pioneer Ventures Group
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Dumbbell size={19} className="text-[#F4510B]" />
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[88px] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-[#F4510B] hover:text-[#F4510B] lg:flex"
        >
          <ChevronLeft
            size={15}
            className={collapsed ? 'rotate-180' : ''}
          />
        </button>
      </aside>
    </>
  );
}
