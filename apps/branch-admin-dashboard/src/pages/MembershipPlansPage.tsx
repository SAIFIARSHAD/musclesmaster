import { useEffect, useState } from 'react';
import {
  Search,
  Tags,
  Clock3,
  Dumbbell,
  RefreshCw,
  CheckCircle2,
  X,
  Eye,
} from 'lucide-react';

import { getMembershipPlansApi } from '../api/membershipPlans.api';
import type { MembershipPlanListResponse } from '../types/membership.types';

type MembershipPlan = MembershipPlanListResponse['data'][number];

type PlanFilter = 'ALL' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'OTHER';

const filters: { label: string; value: PlanFilter }[] = [
  { label: 'All Plans', value: 'ALL' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Other', value: 'OTHER' },
];

function getPlanCategory(plan: MembershipPlan): PlanFilter {
  const type = String(plan.planType || '').toUpperCase();
  const duration = Number(plan.duration);

  if (type.includes('MONTH')) return 'MONTHLY';
  if (type.includes('QUARTER')) return 'QUARTERLY';
  if (type.includes('YEAR')) return 'YEARLY';

  if (duration === 1) return 'MONTHLY';
  if (duration === 3) return 'QUARTERLY';
  if (duration === 12) return 'YEARLY';

  return 'OTHER';
}

function getPlanTypeLabel(plan: MembershipPlan) {
  const category = getPlanCategory(plan);

  if (category !== 'OTHER') {
    return filters.find((filter) => filter.value === category)?.label;
  }

  return String(plan.planType || 'Membership').replace(/_/g, ' ');
}


function formatDuration(totalDays: number): string {
  const days = Math.max(0, Math.floor(Number(totalDays) || 0));

  const years = Math.floor(days / 365);
  const remainingAfterYears = days % 365;

  const months = Math.floor(remainingAfterYears / 30);
  const remainingDays = remainingAfterYears % 30;

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }

  if (remainingDays > 0) {
    parts.push(
      `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`
    );
  }

  return parts.length > 0 ? parts.join(' ') : '0 days';
}


export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<PlanFilter>('ALL');
  const [selectedPlan, setSelectedPlan] =
    useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getMembershipPlansApi();
      setPlans(result);
    } catch (err) {
      console.error('Failed to fetch membership plans:', err);
      setError('Unable to load membership plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      plan.planName?.toLowerCase().includes(searchText) ||
      plan.planType?.toLowerCase().includes(searchText) ||
      plan.description?.toLowerCase().includes(searchText);

    const matchesFilter =
      selectedFilter === 'ALL' ||
      getPlanCategory(plan) === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const closeModal = () => setSelectedPlan(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Tags size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#14243B]">
              Membership Plans
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Explore available membership plans
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchPlans}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-[#F4510B] disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search membership plans..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#F4510B] focus:bg-white focus:ring-2 focus:ring-orange-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedFilter(filter.value)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                selectedFilter === filter.value
                  ? 'bg-[#F4510B] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-[#F4510B]'
              }`}
            >
              {filter.label}
            </button>
          ))}

          <span className="ml-auto text-xs text-slate-500">
            {filteredPlans.length} plans
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={fetchPlans}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-4 h-7 w-2/3 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredPlans.length > 0 ? (
        /* Compact Plan Cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <button
              key={String(plan._id)}
              type="button"
              onClick={() => setSelectedPlan(plan)}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14243B] text-white">
                  <Dumbbell size={17} />
                </div>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  Active
                </span>
              </div>

              <h2 className="mt-3 line-clamp-1 text-base font-bold text-[#14243B]">
                {plan.planName}
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-400">
                {getPlanTypeLabel(plan)}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xl font-extrabold text-[#14243B]">
                  {formatPrice(Number(plan.price))}
                </span>

                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 size={13} />
                  {formatDuration(Number(plan.duration))}
                </span>
              </div>

              <div className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-[#F4510B]">
                  View Details
                </span>

                <Eye
                  size={15}
                  className="text-slate-400 transition group-hover:text-[#F4510B]"
                />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Tags size={28} className="mx-auto text-slate-400" />

          <h3 className="mt-3 text-base font-bold text-[#14243B]">
            No plans found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try another plan type or search keyword.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedFilter('ALL');
            }}
            className="mt-3 text-sm font-semibold text-[#F4510B] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-plan-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-[#14243B] px-6 py-5 text-white">
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close plan details"
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4510B]">
                  <Dumbbell size={21} />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-300">
                    Membership Plan Details
                  </p>

                  <h2
                    id="membership-plan-title"
                    className="mt-1 pr-8 text-xl font-bold"
                  >
                    {selectedPlan.planName}
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Membership Price
                </p>

                <p className="mt-1 text-3xl font-extrabold text-[#14243B]">
                  {formatPrice(Number(selectedPlan.price))}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Plan Type</p>
                  <p className="mt-1 text-sm font-bold text-[#14243B]">
                    {getPlanTypeLabel(selectedPlan)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-bold text-[#14243B]">
                    {formatDuration(Number(selectedPlan.duration))}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#14243B]">
                  Plan Description
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {selectedPlan.description || 'No description available for this plan.'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-[#14243B]">
                  Included Benefits
                </h3>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <CheckCircle2
                    size={17}
                    className={
                      selectedPlan.ptIncluded
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />

                  <span className="text-slate-600">
                    Personal Training{' '}
                    {selectedPlan.ptIncluded ? 'Included' : 'Not Included'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-500">
                  Plan Status
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl bg-[#F4510B] py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
