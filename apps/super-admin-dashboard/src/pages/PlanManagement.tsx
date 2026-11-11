import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  CreditCard,
  Users,
  CalendarDays,
  Loader2,
  Dumbbell,
  X,
  Layers,
  CalendarClock,
  Snowflake,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import MembershipAssignSection from '../components/MembershipAssignSection';
import MembershipRenewal from '../components/MembershipRenewal';
import FreezeMembershipModal from '../components/FreezeMembershipModal';

import {
  getMembershipPlansApi,
  updateMembershipPlanApi,
  type MembershipPlan,
} from '../api/membershipPlan.api';

import AddPlanModal from '../components/AddPlanModal';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type TabType = 'PLANS' | 'MEMBERSHIPS' | 'RENEWALS_FREEZE';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price || 0);

const formatPlanType = (type: string) =>
  type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const tabs = [
  {
    id: 'PLANS' as TabType,
    label: 'Plans',
    description: 'Create and manage plans',
    icon: Layers,
  },
  {
    id: 'MEMBERSHIPS' as TabType,
    label: 'Memberships',
    description: 'Assigned member subscriptions',
    icon: Users,
  },
  {
    id: 'RENEWALS_FREEZE' as TabType,
    label: 'Renewals & Freeze',
    description: 'Renewal and freeze management',
    icon: Snowflake,
  },
];

export default function PlanManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('PLANS');

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<MembershipPlan | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getMembershipPlansApi();

      const planList =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.plans)
              ? response.plans
              : Array.isArray(response?.data?.plans)
                ? response.data.plans
                : [];

      setPlans(planList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load membership plans.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        plan.planName.toLowerCase().includes(searchTerm) ||
        plan.planType.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'ALL' || plan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.status === 'ACTIVE').length;
    const inactive = plans.filter((plan) => plan.status === 'INACTIVE').length;

    return {
      total: plans.length,
      active,
      inactive,
    };
  }, [plans]);

  const openCreateModal = () => {
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

const handleToggleStatus = async (plan: MembershipPlan) => {
  const nextStatus =
    plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const confirmed = window.confirm(
    `Are you sure you want to ${nextStatus.toLowerCase()} "${plan.planName}"?`
  );

  if (!confirmed) return;

  try {
    setDeletingId(plan._id);
    setError('');

    await updateMembershipPlanApi(plan._id, {
      status: nextStatus,
    });

    await fetchPlans();
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        'Unable to update plan status.'
    );
  } finally {
    setDeletingId(null);
  }
};

 

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F4510B]">
            <CreditCard size={15} />
            Membership Management
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#14243B] sm:text-3xl">
            Membership Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage membership plans, member subscriptions, renewals and freezes.
          </p>
        </div>

        {activeTab === 'PLANS' && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add New Plan
          </button>
        )}

        {activeTab === 'RENEWALS_FREEZE' && (
          <button
            type="button"
            onClick={() => setFreezeModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#14243B] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Snowflake size={17} />
            Manage Freeze Requests
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError('');
                }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  isActive
                    ? 'bg-[#14243B] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-orange-50 text-[#F4510B]'
                  }`}
                >
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{tab.label}</p>
                  <p
                    className={`mt-0.5 text-[11px] ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {tab.description}
                  </p>
                </div>

                {isActive && <ArrowRight size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Error */}
      {error && activeTab === 'PLANS' && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* PLANS TAB */}
      {activeTab === 'PLANS' && (
        <div className="space-y-7">
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Plans
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-[#14243B]">
                    {stats.total}
                  </h3>
                </div>
                <div className="rounded-xl bg-orange-50 p-3 text-[#F4510B]">
                  <CreditCard size={23} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Active Plans
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-emerald-600">
                    {stats.active}
                  </h3>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <Users size={23} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Inactive Plans
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-slate-500">
                    {stats.inactive}
                  </h3>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
                  <X size={23} />
                </div>
              </div>
            </div>
          </div>
       
          {/* Search and Filters */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by plan name or type..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as StatusFilter[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                        statusFilter === status
                          ? 'bg-[#14243B] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'ALL' ? 'All Plans' : status}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={fetchPlans}
                  disabled={loading}
                  title="Refresh plans"
                  className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={loading ? 'animate-spin' : ''}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Plans */}
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-100 bg-white">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-[#F4510B]"
                />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading membership plans...
                </p>
              </div>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
                <CreditCard size={27} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#14243B]">
                No membership plans found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search || statusFilter !== 'ALL'
                  ? 'Try changing your search or filter.'
                  : 'Create your first membership plan to get started.'}
              </p>

              {!search && statusFilter === 'ALL' && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <Plus size={17} />
                  Create First Plan
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#F4510B] to-orange-300" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-[#14243B]">
                          {plan.planName}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {formatPlanType(plan.planType)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          plan.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[#14243B]">
                          {formatPrice(plan.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Membership price
                      </p>
                    </div>

                    <div className="my-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-orange-50 p-2 text-[#F4510B]">
                          <CalendarDays size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400">
                            Duration
                          </p>
                          <p className="text-sm font-bold text-[#14243B]">
                            {plan.duration} Days
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                          <Dumbbell size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-slate-400">
                            Personal Training
                          </p>
                          <p className="text-sm font-bold text-[#14243B]">
                            {plan.ptIncluded ? 'Included' : 'Not Included'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="mb-5 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex gap-2">
  <button
    type="button"
    onClick={() => openEditModal(plan)}
    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-[#F4510B] hover:bg-orange-50 hover:text-[#F4510B]"
  >
    <Pencil size={15} />
    Edit Plan
  </button>

  <button
    type="button"
    onClick={() => handleToggleStatus(plan)}
    disabled={deletingId === plan._id}
    title={
      plan.status === 'ACTIVE'
        ? 'Deactivate plan'
        : 'Activate plan'
    }
    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
      plan.status === 'ACTIVE'
        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
    }`}
  >
    {deletingId === plan._id ? (
      <Loader2 size={15} className="animate-spin" />
    ) : (
      <Power size={15} />
    )}

    {plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
  </button>
</div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Count */}
          {!loading && filteredPlans.length > 0 && (
            <p className="text-right text-xs font-medium text-slate-400">
              Showing {filteredPlans.length} of {plans.length} membership plans
            </p>
          )}
        </div>
      )}

      
      {/* MEMBERSHIPS TAB */}
{activeTab === 'MEMBERSHIPS' && (
  <div className="space-y-5">

    {/* Assign Membership */}
    <MembershipAssignSection />

    {/* Assigned Memberships Header */}
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Users size={22} />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-[#14243B]">
            Assigned Memberships
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View member subscriptions and initiate renewals for eligible memberships.
          </p>
        </div>
      </div>
    </div>

    <MembershipRenewal />
  </div>
)}

      {/* RENEWALS & FREEZE TAB */}
      {activeTab === 'RENEWALS_FREEZE' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-[#F4510B]">
                  <CalendarClock size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#14243B]">
                    Membership Renewals
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Review eligible memberships and initiate renewal. New renewals remain pending until payment is confirmed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('MEMBERSHIPS')}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#F4510B] hover:text-orange-700"
                  >
                    View Memberships <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Snowflake size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#14243B]">
                    Freeze Management
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Review member freeze requests, approve or reject them, and manually unfreeze memberships.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFreezeModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    Manage Freeze Requests <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={21} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-[#14243B]">
                  Membership lifecycle
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  A renewal creates a new pending membership. The existing active membership is not replaced until payment is successfully confirmed. Freeze approvals temporarily change an active membership to frozen.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Plan Modal */}
      <AddPlanModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPlan(null);
        }}
        onSaved={fetchPlans}
        plan={selectedPlan}
      />

      {/* Freeze Management Modal */}
      <FreezeMembershipModal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        onUpdated={() => setFreezeModalOpen(false)}
      />
    </div>
  );
}
