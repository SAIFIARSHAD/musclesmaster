import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Menu,
  Bell,
  UserRound,
  LogOut,
  ChevronDown,
  MapPin,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, branch, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-xs font-medium text-slate-400">
            MusclesMaster / Workspace
          </p>

          <h1 className="mt-0.5 text-base font-bold text-[#14243B]">
            Reception Portal
          </h1>

          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <MapPin size={12} className="text-[#F4510B]" />

            {branch?.name || 'Loading branch...'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-orange-50 hover:text-[#F4510B]"
        >
          <Bell size={20} />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 sm:gap-3"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-[#14243B]">
                {user?.name || 'Reception Staff'}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                Reception
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
              <UserRound size={19} />
            </div>

            <ChevronDown
              size={15}
              className="hidden text-slate-400 sm:block"
            />
          </button>

          <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 translate-y-2 rounded-xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-bold text-[#14243B]">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={17} />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}