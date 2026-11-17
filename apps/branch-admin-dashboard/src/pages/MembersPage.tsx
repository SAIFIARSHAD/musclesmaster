
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import {
  Search,
  Users,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

import { getMembersApi } from '../api/members.api';

import MemberForm from '../components/members/MemberForm';
import MemberDetails from '../components/members/MemberDetails';

import type {
  Member,
  MemberStatus,
  MemberPagination,
} from '../types/member.types';

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);

  const [pagination, setPagination] = useState<MemberPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Search and filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MemberStatus | ''>('');

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null,
  );

  // Debounce search to avoid unnecessary API requests.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // Fetch members from backend.
  const fetchMembers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError('');

        const response = await getMembersApi({
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
        });

        setMembers(response.data);
        setPagination(response.pagination);
      } catch (err: unknown) {
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

        setError(
          message || 'Unable to load members. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [search, status],
  );

  // Load members whenever search or status changes.
  useEffect(() => {
    fetchMembers(1);
  }, [fetchMembers]);

  // Handle successful registration.
  const handleMemberCreated = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    fetchMembers(1);
  };

  // Refresh current page.
  const handleRefresh = () => {
    fetchMembers(pagination.page);
  };

  // Pagination handlers.
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchMembers(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchMembers(pagination.page + 1);
    }
  };

  // Counts represent only the currently loaded page.
  const activeCount = members.filter(
    (member) => member.status === 'ACTIVE',
  ).length;

  const inactiveCount = members.filter(
    (member) => member.status === 'INACTIVE',
  ).length;

  // Format date.
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#14243B]">
            Members
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your gym members and their information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#dc4508]"
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Members"
          value={pagination.total}
          icon={<Users size={21} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active on This Page"
          value={activeCount}
          icon={<UserCheck size={21} />}
          iconClass="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive on This Page"
          value={inactiveCount}
          icon={<UserX size={21} />}
          iconClass="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              All Members
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} members found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by name, mobile or ID..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#F4510B] sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as MemberStatus | '')
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => fetchMembers(pagination.page)}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <TableHeading>Member</TableHeading>
                <TableHeading>Member ID</TableHeading>
                <TableHeading>Contact</TableHeading>
                <TableHeading>Gender</TableHeading>
                <TableHeading>Joined On</TableHeading>
                <TableHeading>Status</TableHeading>
                <TableHeading>Action</TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <RefreshCw
                      size={24}
                      className="mx-auto animate-spin text-[#F4510B]"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading members...
                    </p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-sm text-slate-500"
                  >
                    <Users
                      size={30}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-medium text-slate-700">
                      No members found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Member */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 font-semibold text-[#F4510B]">
                          {member.firstName?.charAt(0)}
                          {member.lastName?.charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {member.firstName} {member.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {member.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Member ID */}
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {member.memberId}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.mobile}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.gender}
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(member.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={member.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        title="View member details"
                        onClick={() =>
                          setSelectedMemberId(member._id)
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F4510B]"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
              {' '}· {pagination.total} total members
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={handlePreviousPage}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  pagination.page >= pagination.totalPages
                }
                onClick={handleNextPage}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isFormOpen && (
        <MemberForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleMemberCreated}
        />
      )}

      {/* Member Details Drawer */}
      {selectedMemberId && (
        <MemberDetails
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
};

// Summary Card
const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <div className={`rounded-xl p-2.5 ${iconClass}`}>
        {icon}
      </div>
    </div>

    <h3 className="mt-4 text-2xl font-bold text-[#14243B]">
      {value}
    </h3>
  </div>
);

// Table Heading
const TableHeading = ({
  children,
}: {
  children: ReactNode;
}) => (
  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </th>
);

// Status Badge
const StatusBadge = ({
  status,
}: {
  status: MemberStatus;
}) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      status === 'ACTIVE'
        ? 'bg-green-50 text-green-700'
        : 'bg-orange-50 text-orange-700'
    }`}
  >
    {status}
  </span>
);

export default MembersPage;
