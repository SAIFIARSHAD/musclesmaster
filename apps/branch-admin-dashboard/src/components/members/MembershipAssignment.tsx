import { useEffect, useState } from 'react';
import {
  CreditCard,
  CalendarDays,
  Loader2,
  Save,
} from 'lucide-react';

import { getMembershipPlansApi } from '../../api/membershipPlans.api';
import { assignMembershipApi } from '../../api/memberships.api';

import type { MembershipPlan } from '../../types/membership.types';

interface MembershipAssignmentProps {
  memberId: string;
  onSuccess: () => void;
}

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const MembershipAssignment = ({
  memberId,
  onSuccess,
}: MembershipAssignmentProps) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      try {
        setIsLoading(true);
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

  const handleAssign = async () => {
    if (!planId || !startDate) {
      setError('Please select a membership plan and start date.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await assignMembershipApi({
        memberId,
        planId,
        startDate,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      setSuccess('Membership assigned successfully.');
      setPlanId('');
      setStartDate(getTodayDate());
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

      setError(message || 'Unable to assign membership.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
          <CreditCard size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-[#14243B]">
            Assign Membership
          </h3>
          <p className="text-xs text-slate-500">
            Choose a plan for this member
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
          <Loader2 size={17} className="animate-spin" />
          Loading membership plans...
        </div>
      ) : plans.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No active membership plans are currently available.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="membership-plan"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Membership Plan
            </label>

            <select
              id="membership-plan"
              value={planId}
              onChange={(event) => {
                setPlanId(event.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select a plan</option>

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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#14243B]">
                    {selectedPlan.planName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPlan.planType.replaceAll('_', ' ')}
                  </p>
                </div>

                <p className="text-lg font-bold text-[#F4510B]">
                  ₹{selectedPlan.price.toLocaleString('en-IN')}
                </p>
              </div>

              <p className="mt-3 text-xs text-slate-600">
                Validity: {selectedPlan.duration} days
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="membership-start-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Start Date
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="membership-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-10 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="membership-notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Notes (Optional)
            </label>

            <textarea
              id="membership-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Add any membership notes..."
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
        onClick={handleAssign}
        disabled={isLoading || isSaving || plans.length === 0}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Save size={17} />
        )}

        {isSaving ? 'Assigning...' : 'Assign Membership'}
      </button>
    </div>
  );
};

export default MembershipAssignment;
