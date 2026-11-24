import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
} from 'lucide-react';

import {
  getMembershipsApi,
  assignMembershipApi,
  type Membership,
  type MembershipStatus,
  type MembershipPagination,
  type MembershipSummary,
} from '../api/memberships.api';
import { getMembersApi, type Member } from '../api/members.api';
import {
  getMembershipPlansApi,
  type MembershipPlan,
} from '../api/membershipPlans.api';

const EMPTY_SUMMARY: MembershipSummary = {
  total: 0,
  active: 0,
  pending: 0,
  expired: 0,
  frozen: 0,
  expiringSoon: 0,
};

const EMPTY_PAGINATION: MembershipPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const formatDate = (date?: string) => {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getMember = (membership: Membership) => {
  return typeof membership.memberId === 'object'
    ? membership.memberId
    : null;
};

const getPlan = (membership: Membership) => {
  return typeof membership.planId === 'object'
    ? membership.planId
    : null;
};

const statusStyles: Record<MembershipStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700 ring-green-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  FROZEN: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  EXPIRED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] =
    useState<MembershipPagination>(EMPTY_PAGINATION);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MembershipStatus | ''>('');
  const [expiringSoon, setExpiringSoon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getMembershipsApi({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status,
        expiringSoon,
      });

      setMemberships(result.memberships);
      setPagination((previous) => ({
        ...result.pagination,
        limit: previous.limit,
      }));
      setSummary(result.summary);
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to load memberships.');
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
    expiringSoon,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMemberships();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [fetchMemberships, refreshKey]);

  const updateFilters = (
    nextStatus: MembershipStatus | '',
    nextExpiringSoon: boolean,
  ) => {
    setStatus(nextStatus);
    setExpiringSoon(nextExpiringSoon);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const refresh = () => setRefreshKey((value) => value + 1);

  const startRecord =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <CreditCard size={23} className="text-[#F4510B]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#14243B]">
              Memberships
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage subscriptions, renewals and membership status.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508]"
          >
            <Plus size={17} />
            Assign Membership
          </button>

          <Link
            to="/members"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#14243B] transition hover:bg-slate-50"
          >
            <Users size={17} />
            View Members
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Memberships"
          value={summary.total}
          icon={<Users size={20} />}
          color="text-[#14243B]"
          bg="bg-slate-100"
          loading={loading}
        />

        <SummaryCard
          label="Active Memberships"
          value={summary.active}
          icon={<CheckCircle2 size={20} />}
          color="text-green-600"
          bg="bg-green-50"
          loading={loading}
        />

        <SummaryCard
          label="Pending Payment"
          value={summary.pending}
          icon={<Clock size={20} />}
          color="text-amber-600"
          bg="bg-amber-50"
          loading={loading}
        />

        <SummaryCard
          label="Expiring Soon"
          value={summary.expiringSoon}
          icon={<AlertTriangle size={20} />}
          color="text-orange-600"
          bg="bg-orange-50"
          loading={loading}
        />
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
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search member, mobile, member ID or plan..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
                onChange={(event) =>
                  updateFilters(
                    event.target.value as MembershipStatus | '',
                    false,
                  )
                }
                className="w-full min-w-44 appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-orange-400"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="FROZEN">Frozen</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                updateFilters('', !expiringSoon)
              }
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                expiringSoon
                  ? 'border-orange-300 bg-orange-50 text-[#F4510B]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Expiring Soon
            </button>
          </div>
        </div>
      </div>

      {/* Membership Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              All Memberships
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Membership records for your assigned branch
            </p>
          </div>

          <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F4510B]">
            {pagination.total} Records
          </span>
        </div>

        {error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-4 rounded-lg bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Member</th>
                  <th className="px-5 py-4 font-semibold">Plan</th>
                  <th className="px-5 py-4 font-semibold">Duration</th>
                  <th className="px-5 py-4 font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Start Date</th>
                  <th className="px-5 py-4 font-semibold">End Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                      Loading memberships...
                    </td>
                  </tr>
                ) : memberships.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <CreditCard
                        size={34}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-medium text-slate-600">
                        No memberships found
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  memberships.map((membership) => {
                    const member = getMember(membership);
                    const plan = getPlan(membership);

                    return (
                      <tr
                        key={membership._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#14243B]">
                            {member
                              ? `${member.firstName} ${member.lastName}`
                              : 'Member'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {member?.memberId || '—'}
                          </p>
                          {member?.mobile && (
                            <p className="mt-1 text-xs text-slate-400">
                              {member.mobile}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {plan?.planName || 'Membership Plan'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {plan?.planType?.replaceAll('_', ' ') || '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {plan?.duration
                            ? `${plan.duration} days`
                            : '—'}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {formatCurrency(membership.agreedAmount)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(membership.startDate)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(membership.endDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              statusStyles[membership.status]
                            }`}
                          >
                            {membership.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            title="View membership"
                            onClick={() => {
                              window.alert(
                                `Membership ID: ${membership._id}`,
                              );
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B]"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!error && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <strong>{startRecord}</strong> to{' '}
              <strong>{endRecord}</strong> of{' '}
              <strong>{pagination.total}</strong> memberships
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() =>
                  setPagination((previous) => ({
                    ...previous,
                    page: previous.page - 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <span className="px-2 text-xs font-semibold text-slate-600">
                {pagination.page} / {Math.max(pagination.totalPages, 1)}
              </span>

              <button
                type="button"
                disabled={
                  pagination.page >= pagination.totalPages ||
                  pagination.totalPages === 0 ||
                  loading
                }
                onClick={() =>
                  setPagination((previous) => ({
                    ...previous,
                    page: previous.page + 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AssignMembershipModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => {
          setShowAssignModal(false);
          refresh();
        }}
      />
    </div>
  );
}
interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  loading: boolean;
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  bg,
  loading,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${bg} ${color}`}>
          {icon}
        </div>
      </div>

      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {loading ? '—' : value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Current branch overview
      </p>
    </div>
  );
}
interface AssignMembershipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignMembershipModal({
  open,
  onClose,
  onSuccess,
}: AssignMembershipModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [notes, setNotes] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadOptions = async () => {
      setLoadingOptions(true);
      setError('');

      try {
        const [memberResult, planResult] = await Promise.all([
          getMembersApi({
            page: 1,
            limit: 100,
            status: 'ACTIVE',
          }),
          getMembershipPlansApi(),
        ]);

        if (cancelled) return;

        setMembers(memberResult.members);
        setPlans(planResult.filter((plan) => plan.status === 'ACTIVE'));
      } catch (err) {
        if (cancelled) return;

        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err
            ? (
                err as {
                  response?: {
                    data?: { message?: string };
                  };
                }
              ).response?.data?.message
            : undefined;

        setError(message || 'Unable to load members and membership plans.');
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMemberId('');
      setPlanId('');
      setNotes('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const selectedPlan = plans.find((plan) => plan._id === planId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!memberId || !planId || !startDate) {
      setError('Please select a member, plan and start date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await assignMembershipApi({
        memberId,
        planId,
        startDate,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      onSuccess();
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to assign membership.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-membership-title"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="assign-membership-title"
              className="text-lg font-bold text-[#14243B]"
            >
              Assign Membership
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a member and assign a membership plan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close assign membership dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {loadingOptions ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading members and membership plans...
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="assign-member"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Select Member <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="assign-member"
                    required
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Choose a member</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} — {member.memberId}
                        {' '}({member.mobile})
                      </option>
                    ))}
                  </select>

                  {members.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No active members found.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="assign-plan"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Membership Plan <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="assign-plan"
                    required
                    value={planId}
                    onChange={(event) => setPlanId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">Choose a membership plan</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.planName} — ₹
                        {plan.price.toLocaleString('en-IN')} ({plan.duration} days)
                      </option>
                    ))}
                  </select>

                  {plans.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No active membership plans found.
                    </p>
                  )}
                </div>

                {selectedPlan && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#14243B]">
                          {selectedPlan.planName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedPlan.planType.replaceAll('_', ' ')} ·{' '}
                          {selectedPlan.duration} days
                        </p>
                      </div>

                      <p className="text-xl font-bold text-[#F4510B]">
                        {formatCurrency(selectedPlan.price)}
                      </p>
                    </div>

                    {selectedPlan.description && (
                      <p className="mt-2 text-xs text-slate-500">
                        {selectedPlan.description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-500">
                      {selectedPlan.ptIncluded
                        ? 'Personal training included'
                        : 'Personal training not included'}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="membership-start-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Membership Start Date{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="membership-start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="membership-notes"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Notes{' '}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="membership-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add any membership-related notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs leading-5 text-amber-800">
                    Membership will be created with PENDING status. It becomes
                    ACTIVE only after the required payment is successfully
                    collected.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loadingOptions ||
                submitting ||
                members.length === 0 ||
                plans.length === 0
              }
              className="rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Membership'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
