
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  Phone,
  Mail,
  Dumbbell,
  Activity,
  Building2,
  IdCard,
  Loader2,
  UserCheck,
} from 'lucide-react';

import {
  getMemberByIdApi,
  type MemberDetails,
} from '../api/members.api';

import MemberStatusBadge from '../components/members/MemberStatusBadge';

const formatDate = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const calculateAge = (dob?: string) => {
  if (!dob) return '—';

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) return '—';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value !== undefined && value !== null && value !== ''
          ? value
          : 'Not provided'}
      </p>
    </div>
  );
}

function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
          {icon}
        </div>
        <h2 className="font-bold text-[#14243B]">{title}</h2>
      </div>

      {children}
    </section>
  );
}

export default function MemberDetailsPage() {
  const { memberId } = useParams<{ memberId: string }>();

  const [details, setDetails] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMember = async () => {
      if (!memberId) {
        setError('Member ID is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await getMemberByIdApi(memberId);

        if (!cancelled) {
          setDetails(result);
        }
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

        setError(message || 'Unable to load member details.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#F4510B]" />
        <p className="text-sm text-slate-500">Loading member profile...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">
          {error || 'Member not found.'}
        </p>

        <Link
          to="/members"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-[#F4510B]"
        >
          <ArrowLeft size={16} />
          Back to Members
        </Link>
      </div>
    );
  }

  const { member, profile, user, branch, trainer } = details;

  const fullName = `${member.firstName} ${member.lastName}`;

  const bmi = profile?.bmi;
  const bmiCategory =
    bmi === undefined || bmi === null
      ? 'Not available'
      : bmi < 18.5
        ? 'Underweight'
        : bmi < 25
          ? 'Normal'
          : bmi < 30
            ? 'Overweight'
            : 'Obese';

  return (
    <div className="space-y-6">
      {/* Back and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/members"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
        >
          <ArrowLeft size={17} />
          Back to Members
        </Link>

        <Link
          to={`/members/${member._id}/edit`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit Member
        </Link>
      </div>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="h-2 bg-gradient-to-r from-[#14243B] via-[#F4510B] to-orange-300" />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl font-bold text-[#F4510B]">
            {member.firstName.charAt(0).toUpperCase()}
            {member.lastName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#14243B]">
                {fullName}
              </h1>

              <MemberStatusBadge status={member.status} />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Member ID: <span className="font-semibold text-slate-700">{member.memberId}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                {member.mobile}
              </span>

              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                {member.email || 'No email'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick information */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Age
          </p>
          <p className="mt-2 text-2xl font-bold text-[#14243B]">
            {calculateAge(member.dob)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            BMI
          </p>
          <p className="mt-2 text-2xl font-bold text-[#14243B]">
            {bmi ?? '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{bmiCategory}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Account Status
          </p>
          <p className={`mt-2 text-lg font-bold ${user.isActive ? 'text-green-600' : 'text-slate-500'}`}>
            {user.isActive ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <ProfileSection
        title="Personal Information"
        icon={<UserRound size={20} />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="First Name" value={member.firstName} />
          <DetailItem label="Last Name" value={member.lastName} />
          <DetailItem label="Gender" value={member.gender} />
          <DetailItem label="Date of Birth" value={formatDate(member.dob)} />
          <DetailItem label="Age" value={calculateAge(member.dob)} />
          <DetailItem label="Member ID" value={member.memberId} />
        </div>
      </ProfileSection>

      {/* Contact Information */}
      <ProfileSection
        title="Contact Information"
        icon={<Phone size={20} />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <DetailItem label="Mobile Number" value={member.mobile} />
          <DetailItem label="Email Address" value={member.email} />
          <div className="sm:col-span-2">
            <DetailItem label="Address" value={member.address} />
          </div>
        </div>
      </ProfileSection>

      {/* Fitness Profile */}
      <ProfileSection
        title="Fitness Profile"
        icon={<Activity size={20} />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Height"
            value={profile?.height ? `${profile.height} cm` : ''}
          />
          <DetailItem
            label="Weight"
            value={profile?.weight ? `${profile.weight} kg` : ''}
          />
          <DetailItem label="BMI" value={bmi} />
          <DetailItem label="BMI Category" value={bmiCategory} />
          <DetailItem label="Fitness Goal" value={profile?.fitnessGoal} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <DetailItem
            label="Medical Conditions / Allergies"
            value={profile?.medicalConditions?.join(', ')}
          />
        </div>
      </ProfileSection>

      {/* Trainer Information */}
      <ProfileSection
        title="Trainer Information"
        icon={<Dumbbell size={20} />}
      >
        {trainer ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Trainer Name" value={trainer.name} />
            <DetailItem label="Trainer Email" value={trainer.email} />
            <DetailItem label="Trainer Mobile" value={trainer.mobile} />
            <DetailItem
              label="Trainer Account"
              value={trainer.isActive ? 'Active' : 'Inactive'}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No trainer is currently assigned to this member.
          </p>
        )}
      </ProfileSection>

      {/* Branch Information */}
      <ProfileSection
        title="Branch Information"
        icon={<Building2 size={20} />}
      >
        {branch ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Branch Name" value={branch.name} />
            <DetailItem label="Branch Code" value={branch.code} />
            <DetailItem label="Phone" value={branch.phone} />
            <DetailItem label="Email" value={branch.email} />
            <div className="sm:col-span-2">
              <DetailItem
                label="Branch Address"
                value={[branch.address, branch.city, branch.state]
                  .filter(Boolean)
                  .join(', ')}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Branch information is unavailable.
          </p>
        )}
      </ProfileSection>

      {/* Registration Information */}
      <ProfileSection
        title="Registration Information"
        icon={<IdCard size={20} />}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Registration Date"
            value={formatDate(member.createdAt)}
          />
          <DetailItem
            label="Last Updated"
            value={formatDate(member.updatedAt)}
          />
          <DetailItem
            label="Account Created"
            value={formatDate(user.createdAt)}
          />
        </div>
      </ProfileSection>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <UserCheck size={19} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-sm leading-6 text-blue-800">
          This profile displays the information currently available in the
          member, user, branch and fitness profile records.
        </p>
      </div>
    </div>
  );
}
