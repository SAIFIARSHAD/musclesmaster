
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

import {
  getMembersApi,
  type Member,
  type MemberPagination,
} from '../api/members.api';

import MembersTable from '../components/members/MembersTable';
import MemberDetailsDrawer from '../components/members/MemberDetailsDrawer';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  const [pagination, setPagination] = useState<MemberPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Member profile drawer
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null,
  );

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getMembersApi({
          page: pagination.page,
          limit: pagination.limit,
          search,
          status,
        });

        if (cancelled) return;

        setMembers(result.members);
        setPagination((previous) => ({
          ...result.pagination,
          limit: previous.limit,
        }));
      } catch (err) {
        if (cancelled) return;

        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err
            ? (
                err as {
                  response?: {
                    data?: {
                      message?: string;
                    };
                  };
                }
              ).response?.data?.message
            : undefined;

        setError(message || 'Unable to load members. Please try again.');
        setMembers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
    refreshKey,
  ]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const refreshMembers = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const closeMemberDrawer = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;

  const startRecord =
    pagination.total === 0
      ? 0
      : (currentPage - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    currentPage * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Users size={22} className="text-[#F4510B]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#14243B]">
                Members
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage and view your gym members.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/members/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508]"
        >
          <UserPlus size={17} />
          Register New Member
        </Link>
      </div>

      {/* Member Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Members
            </p>
            <Users size={19} className="text-orange-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-[#14243B]">
            {loading ? '—' : pagination.total}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Members in your branch
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Active Members
            </p>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-green-600">
            —
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Active account status
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Inactive Members
            </p>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-600">
            —
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Inactive account status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, mobile or member ID..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full min-w-44 appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">All Member Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <button
              type="button"
              onClick={refreshMembers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              All Members
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Member records for your assigned branch
            </p>
          </div>

          <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F4510B]">
            {pagination.total} Members
          </span>
        </div>

        {error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <p className="font-medium text-red-600">{error}</p>

            <button
              type="button"
              onClick={refreshMembers}
              className="mt-4 rounded-lg bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100"
            >
              Try Again
            </button>
          </div>
        ) : (
          <MembersTable
            members={members}
            loading={loading}
            onViewProfile={setSelectedMemberId}
          />
        )}

        {/* Pagination */}
        {!error && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {startRecord}
              </span>
              {' '}to{' '}
              <span className="font-semibold text-slate-700">
                {endRecord}
              </span>
              {' '}of{' '}
              <span className="font-semibold text-slate-700">
                {pagination.total}
              </span>
              {' '}members
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() =>
                  setPagination((previous) => ({
                    ...previous,
                    page: previous.page - 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <span className="px-2 text-xs font-semibold text-slate-600">
                {currentPage} / {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                disabled={
                  currentPage >= totalPages ||
                  totalPages === 0 ||
                  loading
                }
                onClick={() =>
                  setPagination((previous) => ({
                    ...previous,
                    page: previous.page + 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Profile Drawer */}
      <MemberDetailsDrawer
        memberId={selectedMemberId}
        onClose={closeMemberDrawer}
        onMemberUpdated={refreshMembers}
        />
    </div>
  );
}
