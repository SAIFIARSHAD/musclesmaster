import { useEffect, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import {
  X,
  UserRound,
  Phone,
  CalendarDays,
  Dumbbell,
  Building2,
  UserRoundCheck,
  AlertCircle,
  Pencil,
  Save,
  Ban,
  Loader2,
} from 'lucide-react';

import {
  getMemberByIdApi,
  updateMemberApi,
  type MemberDetails,
  type UpdateMemberRequest,
} from '../../api/members.api';

import MemberStatusBadge from './MemberStatusBadge';
interface MemberDetailsDrawerProps {
  memberId: string | null;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

type MemberFormData = UpdateMemberRequest;

const emptyForm: MemberFormData = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dob: '',
  mobile: '',
  email: '',
  address: '',
};

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

const formatDate = (date?: string | Date | null) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '—';

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toDateInputValue = (date?: string | Date | null) => {
  if (!date) return '';

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const calculateAge = (dob?: string | Date) => {
  if (!dob) return '—';

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) return '—';

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) age--;

  return age >= 0 ? `${age} years` : '—';
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value !== undefined && value !== null && value !== ''
          ? value
          : '—'}
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[#F4510B]">{icon}</span>

        <h3 className="text-sm font-semibold text-[#14243B]">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function MemberEditForm({
  formData,
  onChange,
  onSubmit,
  saving,
}: {
  formData: MemberFormData;
  onChange: <K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form
      id="edit-member-form"
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <Section
        title="Personal Information"
        icon={<UserRound size={17} />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="First Name *">
            <input
              type="text"
              required
              maxLength={50}
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              className={inputClass}
              placeholder="First name"
            />
          </FormField>

          <FormField label="Last Name *">
            <input
              type="text"
              required
              maxLength={50}
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              className={inputClass}
              placeholder="Last name"
            />
          </FormField>

          <FormField label="Gender *">
            <select
              required
              value={formData.gender}
              onChange={(e) =>
                onChange(
                  'gender',
                  e.target.value as MemberFormData['gender'],
                )
              }
              className={inputClass}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>

          <FormField label="Date of Birth *">
            <input
              type="date"
              required
              max={toDateInputValue(new Date())}
              value={formData.dob}
              onChange={(e) => onChange('dob', e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>
      </Section>

      <Section
        title="Contact Information"
        icon={<Phone size={17} />}
      >
        <div className="space-y-4">
          <FormField label="Mobile Number *">
            <input
              type="tel"
              required
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              value={formData.mobile}
              onChange={(e) =>
                onChange(
                  'mobile',
                  e.target.value.replace(/\D/g, '').slice(0, 10),
                )
              }
              className={inputClass}
              placeholder="10-digit mobile number"
            />
          </FormField>

          <FormField label="Email Address">
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
              className={inputClass}
              placeholder="Email address"
            />
          </FormField>

          <FormField label="Address">
            <textarea
              rows={3}
              maxLength={500}
              value={formData.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              className={inputClass}
              placeholder="Enter residential address"
            />
          </FormField>
        </div>
      </Section>

      <p className="text-xs text-slate-400">
        * Required fields. Fitness, membership and trainer information
        cannot be edited from the Reception portal.
      </p>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-40"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function MemberDetailsDrawer({
  memberId,
  onClose,
  onMemberUpdated,
}: MemberDetailsDrawerProps) {
  const [details, setDetails] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] =
    useState<MemberFormData>(emptyForm);

  const populateForm = (result: MemberDetails) => {
    const member = result.member;

    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      gender: member.gender || 'MALE',
      dob: toDateInputValue(member.dob),
      mobile: member.mobile || '',
      email: member.email || result.user?.email || '',
      address: member.address || '',
    });
  };

  // Load member details
  useEffect(() => {
    if (!memberId) {
      setDetails(null);
      setError('');
      setSuccessMessage('');
      setEditing(false);
      return;
    }

    let cancelled = false;

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setEditing(false);
      setDetails(null);

      try {
        const result = await getMemberByIdApi(memberId);

        if (cancelled) return;

        setDetails(result);
        populateForm(result);
      } catch (err) {
        if (cancelled) return;

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

        setError(message || 'Unable to load member profile.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  // Escape key and background scroll
  useEffect(() => {
    if (!memberId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || saving) return;

      if (editing) {
        setEditing(false);
        setError('');
        return;
      }

      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [memberId, editing, saving, onClose]);

  const handleFormChange = <K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // IMPORTANT: This only opens edit mode.
  // No API request is made here.
  const handleEdit = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!details || saving) return;

    populateForm(details);
    setError('');
    setSuccessMessage('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (!details || saving) return;

    populateForm(details);
    setEditing(false);
    setError('');
    setSuccessMessage('');
  };

  // API is called ONLY after Save Changes.
  const handleSave = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editing || !memberId || !details || saving) return;

    const payload: UpdateMemberRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      gender: formData.gender,
      dob: formData.dob,
      mobile: formData.mobile.trim(),
      email: formData.email?.trim() || '',
      address: formData.address?.trim() || '',
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.dob ||
      !payload.mobile
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(payload.mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (
      payload.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    ) {
      setError('Please enter a valid email address.');
      return;
    }

    if (new Date(payload.dob) > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await updateMemberApi(memberId, payload);

      // Reload updated profile after successful PUT request.
      const updatedDetails = await getMemberByIdApi(memberId);

      setDetails(updatedDetails);
      populateForm(updatedDetails);

      setEditing(false);
      setSuccessMessage('Member profile updated successfully.');

      onMemberUpdated?.();
    } catch (err) {
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

      setError(message || 'Unable to update member profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!memberId) return null;

  const member = details?.member;
  const profile = details?.profile;
  const trainer = details?.trainer;
  const branch = details?.branch;

  const fullName = member
    ? `${member.firstName} ${member.lastName}`.trim()
    : 'Member Profile';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <aside className="flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#14243B]">
              {editing ? 'Edit Member Profile' : 'Member Profile'}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {editing
                ? 'Update member personal information'
                : 'Complete member information'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close member profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-[#F4510B]" />

              <p className="text-sm text-slate-500">
                Loading member profile...
              </p>
            </div>
          )}

          {!loading && error && !member && (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <AlertCircle size={36} className="text-red-400" />

              <p className="mt-3 font-semibold text-slate-800">
                Unable to load profile
              </p>

              <p className="mt-1 text-sm text-slate-500">{error}</p>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-lg bg-[#14243B] px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          )}

          {!loading && member && (
            <div className="space-y-4">
              {/* Member Summary */}
              <div className="rounded-2xl bg-[#14243B] p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-orange-300">
                    {member.firstName?.charAt(0).toUpperCase()}
                    {member.lastName?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold">
                      {fullName}
                    </h3>

                    <p className="mt-1 text-xs text-slate-300">
                      ID: {member.memberId}
                    </p>

                    <div className="mt-2">
                      <MemberStatusBadge status={member.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-slate-400">Age</p>
                    <p className="mt-1 text-sm font-semibold">
                      {calculateAge(member.dob)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Gender</p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {member.gender?.toLowerCase() || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success */}
              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {successMessage}
                </div>
              )}

              {/* Form / Profile Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* EDIT MODE */}
              {editing ? (
                <MemberEditForm
                  formData={formData}
                  onChange={handleFormChange}
                  onSubmit={handleSave}
                  saving={saving}
                />
              ) : (
                /* VIEW MODE */
                <>
                  <Section
                    title="Personal Information"
                    icon={<UserRound size={17} />}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <DetailItem
                        label="First Name"
                        value={member.firstName}
                      />

                      <DetailItem
                        label="Last Name"
                        value={member.lastName}
                      />

                      <DetailItem
                        label="Date of Birth"
                        value={formatDate(member.dob)}
                      />

                      <DetailItem
                        label="Gender"
                        value={member.gender?.toLowerCase()}
                      />
                    </div>
                  </Section>

                  <Section
                    title="Contact Information"
                    icon={<Phone size={17} />}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <DetailItem
                        label="Mobile"
                        value={member.mobile}
                      />

                      <DetailItem
                        label="Email"
                        value={member.email || details.user?.email}
                      />

                      <div className="col-span-2">
                        <DetailItem
                          label="Address"
                          value={member.address}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section
                    title="Fitness Profile"
                    icon={<Dumbbell size={17} />}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <DetailItem
                        label="Height"
                        value={
                          profile?.height != null
                            ? `${profile.height} cm`
                            : '—'
                        }
                      />

                      <DetailItem
                        label="Weight"
                        value={
                          profile?.weight != null
                            ? `${profile.weight} kg`
                            : '—'
                        }
                      />

                      <DetailItem
                        label="BMI"
                        value={profile?.bmi ?? '—'}
                      />

                      <DetailItem
                        label="Fitness Goal"
                        value={profile?.fitnessGoal}
                      />
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <DetailItem
                        label="Medical Conditions"
                        value={
                          profile?.medicalConditions?.length
                            ? profile.medicalConditions.join(', ')
                            : 'None reported'
                        }
                      />
                    </div>
                  </Section>

                  <Section
                    title="Assigned Trainer"
                    icon={<UserRoundCheck size={17} />}
                  >
                    {trainer ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <DetailItem
                          label="Name"
                          value={trainer.name}
                        />

                        <DetailItem
                          label="Mobile"
                          value={trainer.mobile}
                        />

                        <div className="col-span-2">
                          <DetailItem
                            label="Email"
                            value={trainer.email}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No trainer assigned.
                      </p>
                    )}
                  </Section>

                  <Section
                    title="Branch Information"
                    icon={<Building2 size={17} />}
                  >
                    {branch ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <DetailItem
                          label="Branch"
                          value={branch.name}
                        />

                        <DetailItem
                          label="Branch Code"
                          value={branch.code}
                        />

                        <DetailItem
                          label="City"
                          value={branch.city}
                        />

                        <DetailItem
                          label="State"
                          value={branch.state}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Branch information unavailable.
                      </p>
                    )}
                  </Section>

                  <Section
                    title="Registration Information"
                    icon={<CalendarDays size={17} />}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <DetailItem
                        label="Registered On"
                        value={formatDate(member.createdAt)}
                      />

                      <DetailItem
                        label="Last Updated"
                        value={formatDate(member.updatedAt)}
                      />
                    </div>
                  </Section>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && member && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
            {editing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Ban size={16} className="mr-2 inline" />
                Cancel Editing
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close Profile
                </button>

                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={saving || !details}
                  aria-label="Edit member profile"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc4508] disabled:opacity-50"
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
