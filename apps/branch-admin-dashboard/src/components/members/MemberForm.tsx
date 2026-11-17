
import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

import { createMemberApi } from '../../api/members.api';

import type {
  CreateMemberRequest,
  MemberGender,
} from '../../types/member.types';

interface MemberFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm: CreateMemberRequest = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dob: '',
  mobile: '',
  email: '',
  password: '',
  address: '',
  height: undefined,
  weight: undefined,
  fitnessGoal: '',
  medicalConditions: [],
};

const MemberForm = ({
  onClose,
  onSuccess,
}: MemberFormProps) => {
  const [form, setForm] = useState<CreateMemberRequest>(initialForm);
  const [medicalConditionsText, setMedicalConditionsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    field: keyof CreateMemberRequest,
    value: string | number | undefined,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const payload: CreateMemberRequest = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      address: form.address?.trim(),
      fitnessGoal: form.fitnessGoal?.trim(),
      medicalConditions: medicalConditionsText
        .split(',')
        .map((condition) => condition.trim())
        .filter(Boolean),
    };

    if (!/^[6-9]\d{9}$/.test(payload.mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (payload.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      await createMemberApi(payload);

      onSuccess();
      onClose();
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

      setError(message || 'Unable to register member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100';

  const labelClass = 'text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
              <UserPlus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#14243B]">
                Register New Member
              </h2>
              <p className="text-xs text-slate-500">
                Enter member details to create an account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-5 sm:px-6"
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      handleChange('firstName', e.target.value)
                    }
                    placeholder="Enter first name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      handleChange('lastName', e.target.value)
                    }
                    placeholder="Enter last name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender *</label>
                  <select
                    required
                    value={form.gender}
                    onChange={(e) =>
                      handleChange(
                        'gender',
                        e.target.value as MemberGender,
                      )
                    }
                    className={inputClass}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={form.dob}
                    onChange={(e) =>
                      handleChange('dob', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) =>
                      handleChange(
                        'mobile',
                        e.target.value.replace(/\D/g, ''),
                      )
                    }
                    placeholder="10-digit mobile number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      handleChange('email', e.target.value)
                    }
                    placeholder="member@example.com"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) =>
                      handleChange('address', e.target.value)
                    }
                    placeholder="Enter residential address"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Account Information */}
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                Account Information
              </h3>

              <div>
                <label className={labelClass}>Login Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    handleChange('password', e.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  This password will be used by the member to log in.
                </p>
              </div>
            </section>

            {/* Fitness Information */}
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                Fitness Information
                <span className="ml-2 text-xs font-normal text-slate-400">
                  Optional
                </span>
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Height (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.height ?? ''}
                    onChange={(e) =>
                      handleChange(
                        'height',
                        e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      )
                    }
                    placeholder="e.g. 175"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weight ?? ''}
                    onChange={(e) =>
                      handleChange(
                        'weight',
                        e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      )
                    }
                    placeholder="e.g. 70"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Fitness Goal</label>
                  <input
                    value={form.fitnessGoal}
                    onChange={(e) =>
                      handleChange('fitnessGoal', e.target.value)
                    }
                    placeholder="e.g. Weight loss, Muscle gain"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Medical Conditions
                  </label>
                  <textarea
                    rows={2}
                    value={medicalConditionsText}
                    onChange={(e) =>
                      setMedicalConditionsText(e.target.value)
                    }
                    placeholder="Separate multiple conditions with commas"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Register Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;
