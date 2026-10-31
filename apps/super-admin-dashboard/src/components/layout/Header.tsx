
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  LogOut,
  ChevronDown,
  UserRound,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/branches': 'Branch Management',
  '/users': 'User Management',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = pageNames[location.pathname] || 'Admin Console';

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const initials = (user?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B] lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
            <span>Admin Console</span>
            <span>/</span>
            <span className="font-semibold text-[#F4510B]">
              {pageTitle}
            </span>
          </div>

          <h1 className="truncate text-base font-bold text-[#14243B] sm:mt-1 sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Profile section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-orange-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14243B] text-xs font-bold text-white ring-2 ring-orange-100">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-36 truncate text-xs font-bold text-[#14243B]">
                {user?.name || 'Administrator'}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                Super Administrator
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition sm:block ${
                profileOpen ? 'rotate-180 text-[#F4510B]' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileOpen(false)}
              />

              <div
                role="menu"
                className="absolute right-0 top-14 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                    <UserRound size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#14243B]">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <ShieldCheck size={12} className="text-[#F4510B]" />
                      Super Administrator
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
