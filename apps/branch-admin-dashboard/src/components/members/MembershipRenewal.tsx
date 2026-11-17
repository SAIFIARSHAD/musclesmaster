import { useEffect, useState } from 'react';
import {
  RefreshCw,
  CalendarDays,
  CreditCard,
  Loader2,
  Save,
} from 'lucide-react';

import { getMembershipPlansApi } from '../../api/membershipPlans.api';
import { renewMembershipApi } from '../../api/memberships.api';

import type {
  Membership,
  MembershipPlan,
} from '../../types/membership.types';

interface MembershipRenewalProps {
  membership: Membership;
  onSuccess: () => void;
}

const MembershipRenewal = ({
  membership,
  onSuccess,
}: MembershipRenewalProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planId, setPlanId] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      try {
        const result = await getMembershipPlansApi();

        if (isMounted) {
          setPlans(result);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load membership plans.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPlan = plans.find((plan) => plan._id === planId);

  const handleRenew = async () => {
    if (!planId) {
      setError('Please select a membership plan.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await renewMembershipApi(membership._id, {
        planId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      setSuccess(
        'Renewal initiated successfully. Payment is pending.',
      );

      setPlanId('');
      setNotes('');

      onSuccess();
    } catch (err: unknown) {
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

      setError(message || 'Unable to renew membership.');
    } finally {
      setIsSaving(false);
    }
  };

  const canRenew =
    membership.status === 'ACTIVE' ||
    membership.status === 'EXPIRED';

  if (!canRenew) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
          <RefreshCw size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-[#14243B]">
            Renew Membership
          </h3>
          <p className="text-xs text-slate-500">
            Create a new membership renewal
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Current Membership Status
        </p>

        <p className="mt-1 text-sm font-semibold text-[#14243B]">
          {membership.status}
        </p>

        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays size={14} />
          Current expiry:{' '}
          {new Date(membership.endDate).toLocaleDateString('en-IN')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
          <Loader2 size={17} className="animate-spin" />
          Loading membership plans...
        </div>
      ) : plans.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No active membership plans available.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="renewal-plan"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select Renewal Plan
            </label>

            <select
              id="renewal-plan"
              value={planId}
              onChange={(event) => {
                setPlanId(event.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Choose a plan</option>

              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.planName} — ₹
                  {plan.price.toLocaleString('en-IN')} ({plan.duration} days)
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="flex items-center gap-2 text-[#F4510B]">
                <CreditCard size={17} />
                <span className="text-sm font-semibold">
                  {selectedPlan.planName}
                </span>
              </div>

              <p className="mt-2 text-lg font-bold text-[#14243B]">
                ₹{selectedPlan.price.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Validity: {selectedPlan.duration} days
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="renewal-notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Notes (Optional)
            </label>

            <textarea
              id="renewal-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Add renewal notes..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleRenew}
        disabled={isLoading || isSaving || plans.length === 0}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Save size={17} />
        )}

        {isSaving ? 'Processing...' : 'Renew Membership'}
      </button>
    </div>
  );
};

export default MembershipRenewal;
