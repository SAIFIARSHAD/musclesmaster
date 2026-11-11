
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Search,
  RefreshCw,
  CalendarDays,
  Loader2,
  RotateCcw,
  X,
  Building2,
} from 'lucide-react';

import {
  getMembershipsApi,
  renewMembershipApi,
  type Membership,
  type MembershipStatus,
} from '../api/membership.api';

import {
  getMembershipPlansApi,
  type MembershipPlan,
} from '../api/membershipPlan.api';

import { getBranchesApi,type Branch } from '../api/branch.api';
import { useAuth } from '../context/AuthContext';

interface MembershipRenewalProps {
  onUpdated?: () => void;
}

const STATUS_STYLES: Record<MembershipStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  FROZEN: 'bg-blue-50 text-blue-700 border-blue-200',
};

const getMember = (membership: Membership) => {
  return typeof membership.memberId === 'object' &&
    membership.memberId !== null
    ? membership.memberId
    : null;
};

const getPlan = (membership: Membership) => {
  return typeof membership.planId === 'object' &&
    membership.planId !== null
    ? membership.planId
    : null;
};

const getBranch = (membership: Membership) => {
  return typeof membership.branchId === 'object' &&
    membership.branchId !== null
    ? membership.branchId
    : null;
};

const formatDate = (date?: string) => {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const MembershipRenewal = ({
  onUpdated,
}: MembershipRenewalProps) => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load branches for Super Admin
  useEffect(() => {
    if (!isSuperAdmin) return;

    let cancelled = false;

    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);

const response = await getBranchesApi();

if (cancelled) return;

const activeBranches = response.filter(
  (branch) => branch.isActive
);

setBranches(activeBranches);


      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch branches:', err);
          setError(
            err?.response?.data?.message ||
              'Failed to load branches.'
          );
        }
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
        }
      }
    };

    fetchBranches();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  // Fetch memberships with optional branch filter
  const fetchMemberships = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: 1,
        limit: 100,
        ...(isSuperAdmin && selectedBranchId
          ? { branchId: selectedBranchId }
          : {}),
      };

      const response = await getMembershipsApi(params);

      setMemberships(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch memberships:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to load memberships.'
      );
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedBranchId]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  // Fetch active plans for renewal
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);

      const response = await getMembershipPlansApi({
        page: 1,
        limit: 100,
        status: 'ACTIVE',
      });

      setPlans(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to load membership plans.'
      );
    } finally {
      setPlansLoading(false);
    }
  };

  // Refresh memberships
  const handleRefresh = () => {
    setError('');
    fetchMemberships();
  };

  // Open renewal modal
  const openRenewal = async (membership: Membership) => {
    setSelectedMembership(membership);
    setSelectedPlanId('');
    setRenewalNotes('');
    setError('');
    setSuccess('');
    setRenewalModalOpen(true);

    await fetchPlans();
  };

  // Close renewal modal
  const closeRenewalModal = () => {
    if (submitting) return;

    setRenewalModalOpen(false);
    setSelectedMembership(null);
    setSelectedPlanId('');
    setRenewalNotes('');
    setError('');
    setSuccess('');
  };

  // Submit renewal
  const handleRenewal = async () => {
    if (!selectedMembership || !selectedPlanId) {
      setError('Please select a membership plan.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await renewMembershipApi(selectedMembership._id, {
        planId: selectedPlanId,
        notes: renewalNotes.trim(),
      });

      setSuccess('Membership renewed successfully.');

      await fetchMemberships();

      onUpdated?.();

      window.setTimeout(() => {
        setRenewalModalOpen(false);
        setSelectedMembership(null);
        setSelectedPlanId('');
        setRenewalNotes('');
        setSuccess('');
      }, 1200);
    } catch (err: any) {
      console.error('Membership renewal failed:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to renew membership.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Search and status filtering
  const filteredMemberships = useMemo(() => {
    const query = search.toLowerCase().trim();

    return memberships.filter((membership) => {
      const member = getMember(membership);
      const plan = getPlan(membership);
      const branch = getBranch(membership);

      const memberName = [
        member?.firstName,
        member?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const memberCode = (member?.memberId || '').toLowerCase();
      const email = (member?.email || '').toLowerCase();

      const planName = (plan?.planName || '').toLowerCase();

      const branchName = (branch?.name || '').toLowerCase();
      const branchCode = (branch?.code || '').toLowerCase();

      const matchesSearch =
        !query ||
        memberName.includes(query) ||
        memberCode.includes(query) ||
        email.includes(query) ||
        planName.includes(query) ||
        branchName.includes(query) ||
        branchCode.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        membership.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [memberships, search, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#14243B]">
            Memberships
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View, search and manage member subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, plan or branch..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="FROZEN">Frozen</option>
          </select>

          {/* Branch Filter - Super Admin Only */}
          {isSuperAdmin && (
            <div className="relative">
              <Building2
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={selectedBranchId}
                onChange={(e) =>
                  setSelectedBranchId(e.target.value)
                }
                disabled={branchesLoading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 disabled:opacity-60"
              >
                <option value="">
                  {branchesLoading
                    ? 'Loading branches...'
                    : 'All Branches'}
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch._id}
                    value={branch._id}
                  >
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-700">
              {filteredMemberships.length}
            </span>{' '}
            memberships
          </p>

          {isSuperAdmin && selectedBranchId && (
            <button
              type="button"
              onClick={() => setSelectedBranchId('')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <X size={13} />
              Clear branch filter
            </button>
          )}
        </div>
      </div>

      {/* Membership Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2
              size={20}
              className="animate-spin text-blue-600"
            />
            Loading memberships...
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 rounded-2xl bg-slate-50 p-4">
              <CalendarDays
                size={28}
                className="text-slate-400"
              />
            </div>

            <h3 className="font-bold text-slate-700">
              No memberships found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Plan
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Branch
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Start Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    End Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMemberships.map((membership) => {
                  const member = getMember(membership);
                  const plan = getPlan(membership);
                  const branch = getBranch(membership);

                  const memberName = [
                    member?.firstName,
                    member?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ');

                  const canRenew =
                    membership.status === 'ACTIVE' ||
                    membership.status === 'EXPIRED';

                  return (
                    <tr
                      key={membership._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* Member */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {memberName || 'Unknown Member'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {member?.memberId || '—'}
                        </p>

                        {member?.email && (
                          <p className="mt-1 text-xs text-slate-400">
                            {member.email}
                          </p>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {plan?.planName || 'Unknown Plan'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {plan?.planType || '—'}
                          {plan?.duration
                            ? ` · ${plan.duration} days`
                            : ''}
                        </p>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <Building2 size={15} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-700">
                              {branch?.name || '—'}
                            </p>

                            {branch?.code && (
                              <p className="mt-1 text-xs text-slate-400">
                                {branch.code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(membership.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(membership.endDate)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                            STATUS_STYLES[membership.status] ||
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {membership.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        {canRenew ? (
                          <button
                            type="button"
                            onClick={() =>
                              openRenewal(membership)
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            <RotateCcw size={14} />
                            Renew
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renewal Modal */}
      {renewalModalOpen && selectedMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#14243B]">
                  Renew Membership
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Extend the member's subscription.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRenewalModal}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              {/* Current Membership */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Membership
                </p>

                <p className="mt-2 font-bold text-slate-800">
                  {getMember(selectedMembership)?.firstName || ''}{' '}
                  {getMember(selectedMembership)?.lastName || ''}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">
                      Current Plan
                    </p>

                    <p className="mt-1 font-semibold text-slate-700">
                      {getPlan(selectedMembership)?.planName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Current End Date
                    </p>

                    <p className="mt-1 font-semibold text-slate-700">
                      {formatDate(selectedMembership.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Select Plan */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select New Membership Plan
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <select
                  value={selectedPlanId}
                  onChange={(e) =>
                    setSelectedPlanId(e.target.value)
                  }
                  disabled={plansLoading || submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:opacity-60"
                >
                  <option value="">
                    {plansLoading
                      ? 'Loading plans...'
                      : 'Choose a plan'}
                  </option>

                  {plans.map((plan) => (
                    <option
                      key={plan._id}
                      value={plan._id}
                    >
                      {plan.planName} — ₹{plan.price}
                      {plan.duration
                        ? ` (${plan.duration} days)`
                        : ''}
                    </option>
                  ))}
                </select>

                {!plansLoading && plans.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No active membership plans available.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes (Optional)
                </label>

                <textarea
                  rows={3}
                  value={renewalNotes}
                  onChange={(e) =>
                    setRenewalNotes(e.target.value)
                  }
                  disabled={submitting}
                  placeholder="Add any renewal notes..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:opacity-60"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRenewalModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleRenewal}
                  disabled={
                    submitting ||
                    plansLoading ||
                    !selectedPlanId
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Confirm Renewal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipRenewal;
