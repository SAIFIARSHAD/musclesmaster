import { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setProfileOpen(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
    : 'BA';

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-7 lg:px-9">
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#F4510B] lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">
            MusclesMaster AI / Branch Panel
          </p>

          <h1 className="mt-0.5 truncate text-base font-bold text-[#14243B] sm:text-lg">
            Branch Administration
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#F4510B]"
        >
          <Bell size={20} strokeWidth={1.9} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#F4510B]" />
        </button>

        <div className="hidden h-9 w-px bg-slate-200 sm:block" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3 sm:px-2"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#14243B] text-xs font-bold text-white">
              {initials}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[150px] truncate text-sm font-bold text-slate-800">
                {user?.name || 'Branch Admin'}
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Branch Admin
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform sm:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-4">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {user?.name || 'Branch Admin'}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email || ''}
                  </p>

                  <span className="mt-3 inline-flex rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F4510B]">
                    Branch Admin
                  </span>
                </div>

                <div className="p-2">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600">
                    <UserRound size={17} />
                    <span>Account Profile</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut size={17} />

                    {isLoggingOut ? 'Signing out...' : 'Logout'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
