import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  Snowflake,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { getMembershipsApi } from '../api/memberships.api';
import { getMembershipPlansApi } from '../api/membershipPlans.api';
import MembershipDetails from '../components/memberships/MembershipDetails';

import type {
  Membership,
  MembershipPlan,
  MembershipStatus,
  MembershipPagination,
} from '../types/membership.types';

const PAGE_LIMIT = 10;

const MembershipsPage = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [pagination, setPagination] = useState<MembershipPagination>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });

  const [status, setStatus] = useState<MembershipStatus | ''>('');
  const [planId, setPlanId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMembershipId, setSelectedMembershipId] =
  useState<string | null>(null);

  const fetchMemberships = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await getMembershipsApi({
        page: pagination.page,
        limit: PAGE_LIMIT,
        status: status || undefined,
        planId: planId || undefined,
      });

      setMemberships(response.data);
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

      setError(message || 'Unable to load memberships.');
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, status, planId, refreshKey]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  // Fetch active membership plans for the filter.
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const result = await getMembershipPlansApi();
        setPlans(result);
      } catch {
        setPlans([]);
      } finally {
        setIsPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleStatusChange = (value: string) => {
    setStatus(value as MembershipStatus | '');
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handlePlanChange = (value: string) => {
    setPlanId(value);
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const handlePreviousPage = () => {
    setPagination((previous) => ({
      ...previous,
      page: Math.max(1, previous.page - 1),
    }));
  };

  const handleNextPage = () => {
    setPagination((previous) => ({
      ...previous,
      page: Math.min(previous.totalPages, previous.page + 1),
    }));
  };

  const countStatus = (value: MembershipStatus) =>
    memberships.filter((item) => item.status === value).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#14243B]">
            Membership Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage memberships, plans and subscription status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={isLoading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Memberships"
          value={pagination.total}
          icon={<Users size={21} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active on This Page"
          value={countStatus('ACTIVE')}
          icon={<CheckCircle2 size={21} />}
          iconClass="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Pending on This Page"
          value={countStatus('PENDING')}
          icon={<Clock size={21} />}
          iconClass="bg-orange-50 text-orange-600"
        />

        <SummaryCard
          title="Frozen on This Page"
          value={countStatus('FROZEN')}
          icon={<Snowflake size={21} />}
          iconClass="bg-blue-50 text-blue-600"
        />
        
      </div>

      {/* Membership Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              All Memberships
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} memberships found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
              <option value="FROZEN">Frozen</option>
            </select>

            <select
              value={planId}
              onChange={(event) => handlePlanChange(event.target.value)}
              disabled={isPlansLoading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B] disabled:opacity-50"
            >
              <option value="">All Plans</option>

              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.planName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <TableHeading>Member</TableHeading>
                <TableHeading>Membership Plan</TableHeading>
                <TableHeading>Amount</TableHeading>
                <TableHeading>Start Date</TableHeading>
                <TableHeading>Expiry Date</TableHeading>
                <TableHeading>Status</TableHeading>
                <TableHeading>Action</TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto animate-spin text-[#F4510B]"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading memberships...
                    </p>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-sm text-slate-500"
                  >
                    <CreditCard
                      size={32}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-semibold text-slate-700">
                      No memberships found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                memberships.map((membership) => {
                  const member =
                    typeof membership.memberId === 'object'
                      ? membership.memberId
                      : null;

                  const plan =
                    typeof membership.planId === 'object'
                      ? membership.planId
                      : null;

                  return (
                    <tr
                      key={membership._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* Member */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 font-semibold text-[#F4510B]">
                            {member?.firstName?.charAt(0) || 'M'}
                            {member?.lastName?.charAt(0) || ''}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {member
                                ? `${member.firstName} ${member.lastName}`
                                : 'Member information unavailable'}
                            </p>

                            <p className="text-xs text-slate-500">
                              {member?.memberId || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {plan?.planName || 'Plan unavailable'}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {plan?.planType?.replaceAll('_', ' ') || '—'}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        ₹{membership.agreedAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <DateValue date={membership.startDate} />
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <DateValue date={membership.endDate} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <MembershipStatusBadge status={membership.status} />
                      </td>

                      {/* Action - details will be connected in next step */}
                      <td className="px-4 py-4">
  <button
    type="button"
    title="View membership details"
    onClick={() => setSelectedMembershipId(membership._id)}
    className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F4510B]"
  >
    <Eye size={18} />
  </button>
</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
              {' '}· {pagination.total} total memberships
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
                disabled={pagination.page >= pagination.totalPages}
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
      {/* Membership Details Drawer - Outside Table */}
      {selectedMembershipId && (
        <MembershipDetails
          membershipId={selectedMembershipId}
          onClose={() => setSelectedMembershipId(null)}
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
  icon: React.ReactNode;
  iconClass: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>

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
const TableHeading = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </th>
);

// Status Badge
const MembershipStatusBadge = ({
  status,
}: {
  status: MembershipStatus;
}) => {
  const styles: Record<MembershipStatus, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    PENDING: 'bg-orange-50 text-orange-700',
    EXPIRED: 'bg-slate-100 text-slate-600',
    FROZEN: 'bg-blue-50 text-blue-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
};

// Date Formatter
const DateValue = ({ date }: { date?: string }) => {
  if (!date) return <span>—</span>;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return <span>—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <CalendarDays size={14} className="text-slate-400" />
      {parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
    </span>
  );
};

export default MembershipsPage;
