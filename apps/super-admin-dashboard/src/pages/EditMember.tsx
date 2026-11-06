import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  UserRound,
  Dumbbell,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import {
  getMemberByIdApi,
  updateMemberApi,
  type MemberByIdResponse,
  type UpdateMemberPayload,
  type MemberGender,
} from '../api/member.api';

import { useAuth } from '../context/AuthContext';


interface EditFormState {
  firstName: string;
  lastName: string;
  gender: MemberGender;
  dob: string;
  mobile: string;
  email: string;
  address: string;
  height: string;
  weight: string;
  fitnessGoal: string;
  medicalConditions: string;
}

const initialForm: EditFormState = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dob: '',
  mobile: '',
  email: '',
  address: '',
  height: '',
  weight: '',
  fitnessGoal: '',
  medicalConditions: '',
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-orange-50';

const labelClass =
  'mb-2 block text-sm font-semibold text-slate-700';

export default function EditMember() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState<EditFormState>(initialForm);
  const [data, setData] = useState<MemberByIdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReception = user?.role === 'RECEPTION';

  const bmi = useMemo(() => {
    const height = Number(form.height);
    const weight = Number(form.weight);

    if (
      !form.height ||
      !form.weight ||
      !Number.isFinite(height) ||
      !Number.isFinite(weight) ||
      height <= 0 ||
      weight <= 0
    ) {
      return '—';
    }

    return (weight / Math.pow(height / 100, 2)).toFixed(1);
  }, [form.height, form.weight]);

  const fetchMember = useCallback(async () => {
    if (!memberId) {
      setError('Member ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await getMemberByIdApi(memberId);
      setData(result);

      setForm({
        firstName: result.member.firstName || '',
        lastName: result.member.lastName || '',
        gender: result.member.gender || 'MALE',
        dob: result.member.dob
          ? result.member.dob.slice(0, 10)
          : '',
        mobile: result.member.mobile || '',
        email: result.member.email || '',
        address: result.member.address || '',
        height:
          result.profile?.height != null
            ? String(result.profile.height)
            : '',
        weight:
          result.profile?.weight != null
            ? String(result.profile.weight)
            : '',
        fitnessGoal: result.profile?.fitnessGoal || '',
        medicalConditions:
          result.profile?.medicalConditions?.join('\n') || '',
      });
    } catch (err: unknown) {
      console.error('Failed to load member for editing:', err);

      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err
          ? (
              err as {
                response?: { data?: { message?: string } };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to load member details.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void fetchMember();
  }, [fetchMember]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!memberId) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    if (!form.dob || Number.isNaN(new Date(form.dob).getTime())) {
      setError('Please enter a valid date of birth.');
      return;
    }

    const height = form.height.trim()
      ? Number(form.height)
      : undefined;

    const weight = form.weight.trim()
      ? Number(form.weight)
      : undefined;

    if (
      (height !== undefined && (!Number.isFinite(height) || height <= 0)) ||
      (weight !== undefined && (!Number.isFinite(weight) || weight <= 0))
    ) {
      setError('Height and weight must be valid positive numbers.');
      return;
    }

    const payload: UpdateMemberPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      dob: form.dob,
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      ...(isReception
        ? {}
        : {
            height,
            weight,
            fitnessGoal: form.fitnessGoal.trim(),
            medicalConditions: form.medicalConditions
              .split('\n')
              .map((condition) => condition.trim())
              .filter(Boolean),
          }),
    };

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await updateMemberApi(memberId, payload);

      setSuccess('Member details updated successfully.');

      // Return to the profile after a successful save.
      navigate(`/members/${memberId}`, {
        state: { updated: true },
      });
    } catch (err: unknown) {
      console.error('Failed to update member:', err);

      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err
          ? (
              err as {
                response?: { data?: { message?: string } };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to update member details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3">
        <RefreshCw
          size={30}
          className="animate-spin text-[#F4510B]"
        />
        <p className="text-sm text-slate-500">
          Loading member details...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={28} />
        <h2 className="font-bold text-[#14243B]">
          Unable to load member
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || 'Member details could not be found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="mt-5 rounded-xl bg-[#14243B] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Back to Members
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(`/members/${memberId}`)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
      >
        <ArrowLeft size={17} />
        Back to Profile
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 text-sm text-slate-500">
            Members / {data.member.memberId} / Edit
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#14243B] sm:text-3xl">
            Edit Member
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update personal and fitness information.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
            data.member.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-orange-50 text-orange-700'
          }`}
        >
          {data.member.status}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[#14243B]">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500">
                Basic member details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                maxLength={50}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                maxLength={50}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Gender *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
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
                name="dob"
                value={form.dob}
                onChange={handleChange}
                required
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Mobile *</label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                required
                maxLength={10}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                maxLength={250}
                className={inputClass}
                placeholder="Enter member address"
              />
            </div>
          </div>
        </section>

        {/* Fitness Information */}
        {!isReception && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Dumbbell size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#14243B]">
                  Fitness Information
                </h2>
                <p className="text-xs text-slate-500">
                  Body measurements and fitness details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  min="1"
                  max="300"
                  step="0.1"
                  className={inputClass}
                  placeholder="e.g. 176"
                />
              </div>

              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  min="1"
                  max="500"
                  step="0.1"
                  className={inputClass}
                  placeholder="e.g. 76"
                />
              </div>

              <div>
                <label className={labelClass}>Calculated BMI</label>
                <div className="flex min-h-[46px] items-center rounded-xl border border-orange-100 bg-orange-50 px-4 text-lg font-bold text-[#F4510B]">
                  {bmi}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Fitness Goal</label>
                <select
                  name="fitnessGoal"
                  value={form.fitnessGoal}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select fitness goal</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Muscle Building">Muscle Building</option>
                  <option value="General Fitness">General Fitness</option>
                  <option value="Strength Training">Strength Training</option>
                  <option value="Endurance">Endurance</option>
                  <option value="Flexibility">Flexibility</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={form.medicalConditions}
                  onChange={handleChange}
                  rows={4}
                  className={inputClass}
                  placeholder="Enter one medical condition per line"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Enter each condition on a separate line.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(`/members/${memberId}`)}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D94308] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
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
  );
}
