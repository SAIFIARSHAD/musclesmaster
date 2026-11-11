
import { useEffect, useState, type FormEvent } from 'react';
import { X, Loader2, Save } from 'lucide-react';

import {
  createMembershipPlanApi,
  updateMembershipPlanApi,
  type MembershipPlan,
  type MembershipPlanType,
  type MembershipPlanStatus,
  type CreateMembershipPlanPayload,
} from '../api/membershipPlan.api';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  plan?: MembershipPlan | null;
}

const initialForm = {
  planName: '',
  planType: 'MONTHLY' as MembershipPlanType,
  duration: '30',
  price: '',
  description: '',
  ptIncluded: false,
  status: 'ACTIVE' as MembershipPlanStatus,
};

const planTypes: { label: string; value: MembershipPlanType }[] = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Half Yearly', value: 'HALF_YEARLY' },
  { label: 'Annual', value: 'ANNUAL' },
  { label: 'Personal Training', value: 'PERSONAL_TRAINING' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Corporate', value: 'CORPORATE' },
];

export default function AddPlanModal({
  isOpen,
  onClose,
  onSaved,
  plan,
}: AddPlanModalProps) {
  const isEditMode = Boolean(plan);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setForm({
        planName: plan.planName || '',
        planType: plan.planType || 'MONTHLY',
        duration: String(plan.duration ?? 30),
        price: String(plan.price ?? ''),
        description: plan.description || '',
        ptIncluded: Boolean(plan.ptIncluded),
        status: plan.status || 'ACTIVE',
      });
    } else {
      setForm(initialForm);
    }

    setError('');
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const handleChange = (
    field: keyof typeof initialForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const duration = Number(form.duration);
    const price = Number(form.price);

    if (!form.planName.trim()) {
      setError('Please enter a plan name.');
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setError('Duration must be a positive number of days.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be greater than zero.');
      return;
    }

    const payload: CreateMembershipPlanPayload = {
      planName: form.planName.trim(),
      planType: form.planType,
      duration,
      price,
      description: form.description.trim(),
      ptIncluded: form.ptIncluded,
      
    };

    try {
      setLoading(true);

      if (plan?._id) {
  await updateMembershipPlanApi(plan._id, {
    ...payload,
    status: form.status,
  });
} else {
  await createMembershipPlanApi(payload);
}

      onSaved();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-[#14243B]">
              {isEditMode ? 'Edit Membership Plan' : 'Create Membership Plan'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? 'Update the membership plan details.'
                : 'Add a new membership plan for your gym.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.planName}
              onChange={(e) => handleChange('planName', e.target.value)}
              placeholder="e.g. Gold Membership"
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Plan Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.planType}
                onChange={(e) =>
                  handleChange('planType', e.target.value as MembershipPlanType)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              >
                {planTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="30"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="e.g. 1500"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this plan includes..."
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {isEditMode && (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      Plan Status
    </label>

    <select
      value={form.status}
      onChange={(e) =>
        handleChange(
          'status',
          e.target.value as MembershipPlanStatus
        )
      }
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
    >
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
    </select>

    <p className="mt-2 text-xs text-slate-500">
      Inactive plans cannot be assigned to new memberships or renewals.
      Existing memberships will remain unaffected.
    </p>
  </div>
)}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-[#14243B]">
                Personal Training Included
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Does this plan include personal training?
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.ptIncluded}
              onClick={() =>
                handleChange('ptIncluded', !form.ptIncluded)
              }
              className={`relative h-6 w-11 rounded-full transition ${
                form.ptIncluded ? 'bg-[#F4510B]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  form.ptIncluded ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

         

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {isEditMode ? 'Update Plan' : 'Create Plan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
