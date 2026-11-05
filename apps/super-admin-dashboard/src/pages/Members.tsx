
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertCircle,
  Building2,
  CalendarDays,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import {
  getMembersApi,
  type MemberListItem,
  type MemberStatus,
  type MemberPagination,
} from '../api/member.api';
import {
  getBranchesApi,
  type Branch,
} from '../api/branch.api';

const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | MemberStatus;

const initialPagination: MemberPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

export default function Members() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] =
    useState<MemberPagination>(initialPagination);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [branchId, setBranchId] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Map branch ID to branch name.
  const branchMap = useMemo(() => {
    return new Map(
      branches.map((branch) => [branch._id, branch.name]),
    );
  }, [branches]);

  // Fetch branches for Super Admin.
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchBranches = async () => {
      try {
        const response = await getBranchesApi();
        setBranches(response);
      } catch (err) {
        console.error('Unable to fetch branches:', err);
      }
    };

    void fetchBranches();
  }, [isSuperAdmin]);

  // Fetch members.
  const fetchMembers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response = await getMembersApi({
          page: pagination.page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: status === 'ALL' ? undefined : status,
          branchId:
            isSuperAdmin && branchId !== 'ALL'
              ? branchId
              : undefined,
        });

        setMembers(response.members);
        setPagination(response.pagination);
      } catch (err: unknown) {
        console.error('Unable to fetch members:', err);

        setMembers([]);
        setError(
          'Unable to load members. Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      search,
      status,
      branchId,
      isSuperAdmin,
    ],
  );

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  // Reset page when filters change.
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleStatusChange = (value: StatusFilter) => {
    setStatus(value);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleBranchChange = (value: string) => {
    setBranchId(value);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setBranchId('ALL');
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const hasFilters =
    search.trim() !== '' ||
    status !== 'ALL' ||
    (isSuperAdmin && branchId !== 'ALL');

  const activeCount = members.filter(
    (member) => member.status === 'ACTIVE',
  ).length;

  const inactiveCount = members.filter(
    (member) => member.status === 'INACTIVE',
  ).length;

  const formatDate = (date?: string) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getBranchName = (id: string) => {
    return branchMap.get(id) || 'Branch';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
      .toUpperCase();
  };

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages
    ) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page: newPage,
    }));
  };

  const stats = [
    {
      title: 'Total Members',
      value: pagination.total,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Active Members',
      value: activeCount,
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Inactive Members',
      value: inactiveCount,
      icon: UserX,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <span>Management</span>
            <span>/</span>
            <span className="font-medium text-[#F4510B]">
              Members
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#14243B] sm:text-3xl">
            Member Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage gym members, view registrations and track
            member status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/members/new')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D94308] focus:outline-none focus:ring-4 focus:ring-orange-100"
        >
          <Plus size={18} />
          Add New Member
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#14243B]">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={23} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#14243B]">
              All Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} registered members
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchMembers(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? 'animate-spin' : ''
              }
            />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
              placeholder="Search by name, mobile or member ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-orange-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(
                    event.target.value as StatusFilter,
                  )
                }
                className="w-full min-w-[155px] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-[#F4510B] focus:bg-white sm:w-auto"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {isSuperAdmin && (
              <div className="relative">
                <Building2
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={branchId}
                  onChange={(event) =>
                    handleBranchChange(event.target.value)
                  }
                  className="w-full min-w-[175px] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-[#F4510B] focus:bg-white sm:w-auto"
                >
                  <option value="ALL">All Branches</option>

                  {branches.map((branch) => (
                    <option
                      key={branch._id}
                      value={branch._id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#F4510B]"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void fetchMembers(true)}
              className="ml-auto font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Member ID</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Branch</th>
                <th className="px-5 py-4">Joined On</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-slate-500"
                  >
                    <RefreshCw
                      size={22}
                      className="mx-auto mb-3 animate-spin text-[#F4510B]"
                    />
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Users size={26} />
                      </div>

                      <p className="font-semibold text-[#14243B]">
                        No members found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {hasFilters
                          ? 'Try changing your search or filters.'
                          : 'Start by registering your first gym member.'}
                      </p>

                      {!hasFilters && (
                        <button
                          type="button"
                          onClick={() => navigate('/members/new')}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D94308]"
                        >
                          <Plus size={16} />
                          Add Member
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member._id}
                    className="transition hover:bg-slate-50/80"
                  >
                    {/* Member */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#F4510B]">
                          {getInitials(
                            member.firstName,
                            member.lastName,
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-[#14243B]">
                            {member.firstName} {member.lastName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {member.gender}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Member ID */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#14243B]">
                        <Hash
                          size={15}
                          className="text-slate-400"
                        />
                        {member.memberId}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone
                            size={14}
                            className="text-slate-400"
                          />
                          {member.mobile}
                        </p>

                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail
                            size={14}
                            className="text-slate-400"
                          />
                          {member.email || 'No email'}
                        </p>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2
                          size={15}
                          className="text-slate-400"
                        />
                        {getBranchName(member.branchId)}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={15}
                          className="text-slate-400"
                        />
                        {formatDate(member.createdAt)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          member.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : 'bg-orange-500'
                          }`}
                        />
                        {member.status === 'ACTIVE'
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && members.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-semibold text-[#14243B]">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>
              {' '}to{' '}
              <span className="font-semibold text-[#14243B]">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}
              </span>
              {' '}of{' '}
              <span className="font-semibold text-[#14243B]">
                {pagination.total}
              </span>
              {' '}members
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePageChange(pagination.page - 1)
                }
                disabled={pagination.page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-2 text-sm font-medium text-slate-600">
                Page {pagination.page} of{' '}
                {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                onClick={() =>
                  handlePageChange(pagination.page + 1)
                }
                disabled={
                  pagination.page >= pagination.totalPages
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
