import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';

import { updateMemberApi } from '../../api/members.api';

import type {
  Member,
  MemberGender,
  MemberProfile,
  UpdateMemberRequest,
} from '../../types/member.types';

interface MemberEditFormProps {
  member: Member;
  profile: MemberProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MemberEditForm = ({
  member,
  profile,
  onClose,
  onSuccess,
}: MemberEditFormProps) => {
  const [form, setForm] = useState<UpdateMemberRequest>({
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    gender: member.gender,
    dob: member.dob
      ? new Date(member.dob).toISOString().slice(0, 10)
      : '',
    mobile: member.mobile || '',
    email: member.email || '',
    address: member.address || '',
    height: profile?.height,
    weight: profile?.weight,
    fitnessGoal: profile?.fitnessGoal || '',
    medicalConditions: profile?.medicalConditions || [],
  });

  const [medicalConditionsText, setMedicalConditionsText] =
    useState((profile?.medicalConditions || []).join(', '));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      gender: member.gender,
      dob: member.dob
        ? new Date(member.dob).toISOString().slice(0, 10)
        : '',
      mobile: member.mobile || '',
      email: member.email || '',
      address: member.address || '',
      height: profile?.height,
      weight: profile?.weight,
      fitnessGoal: profile?.fitnessGoal || '',
      medicalConditions: profile?.medicalConditions || [],
    });

    setMedicalConditionsText(
      (profile?.medicalConditions || []).join(', '),
    );
  }, [member, profile]);

  const handleChange = (
    field: keyof UpdateMemberRequest,
    value: string | number | undefined,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100';

  const labelClass = 'text-sm font-medium text-slate-700';

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError('');

    const payload: UpdateMemberRequest = {
      ...form,
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      email: form.email?.trim().toLowerCase(),
      mobile: form.mobile?.trim(),
      address: form.address?.trim(),
      fitnessGoal: form.fitnessGoal?.trim(),
      medicalConditions: medicalConditionsText
        .split(',')
        .map((condition) => condition.trim())
        .filter(Boolean),
    };

    if (!payload.mobile || !/^[6-9]\d{9}$/.test(payload.mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      setIsSubmitting(true);

      await updateMemberApi(member._id, payload);

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
                  data?: {
                    message?: string;
                  };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to update member details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#14243B]">
              Edit Member
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Update {member.firstName} {member.lastName}'s information.
            </p>
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
                    value={form.firstName || ''}
                    onChange={(e) =>
                      handleChange('firstName', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    required
                    value={form.lastName || ''}
                    onChange={(e) =>
                      handleChange('lastName', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender *</label>
                  <select
                    required
                    value={form.gender || 'MALE'}
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
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dob || ''}
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
                    value={form.mobile || ''}
                    onChange={(e) =>
                      handleChange(
                        'mobile',
                        e.target.value.replace(/\D/g, ''),
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email || ''}
                    onChange={(e) =>
                      handleChange('email', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <textarea
                    rows={2}
                    value={form.address || ''}
                    onChange={(e) =>
                      handleChange('address', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Fitness Information */}
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                Fitness Information
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
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Fitness Goal</label>
                  <input
                    value={form.fitnessGoal || ''}
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

          {/* Footer */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberEditForm;
