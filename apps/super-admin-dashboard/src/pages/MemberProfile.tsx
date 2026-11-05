import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  Dumbbell,
  Building2,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Ruler,
  Weight,
  HeartPulse,
} from 'lucide-react';

import {
  getMemberByIdApi,
  type MemberByIdResponse,
} from '../api/member.api';

import MemberProfileHeader from '../components/members/MemberProfileHeader';
import MemberInfoSection from '../components/members/MemberInfoSection';

const formatDate = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<MemberByIdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err: unknown) {
      console.error('Failed to fetch member profile:', err);

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

      setError(message || 'Unable to load member profile.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void fetchMember();
  }, [fetchMember]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F4510B]" />
        <p className="text-sm text-slate-500">
          Loading member profile...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <UserRound size={23} />
        </div>

        <h2 className="text-lg font-bold text-slate-800">
          Unable to load profile
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || 'Member details could not be found.'}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/members')}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Members
          </button>

          <button
            type="button"
            onClick={() => void fetchMember()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D94308]"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { member, profile, user, branch, trainer } = data;

  const medicalConditions =
    profile?.medicalConditions?.length
      ? profile.medicalConditions.join(', ')
      : 'None reported';

  const branchAddress = [
    branch?.address,
    branch?.city,
    branch?.state,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/members')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#F4510B]"
      >
        <ArrowLeft size={17} />
        Back to Members
      </button>

      <MemberProfileHeader member={member} />

      <MemberInfoSection
        title="Personal Information"
        icon={UserRound}
        columns={2}
        items={[
          {
            label: 'Date of Birth',
            value: formatDate(member.dob),
            icon: CalendarDays,
          },
          {
            label: 'Mobile',
            value: member.mobile || '—',
            icon: Phone,
          },
          {
            label: 'Email',
            value: member.email || '—',
            icon: Mail,
          },
          {
            label: 'Gender',
            value: member.gender || '—',
          },
          {
            label: 'Address',
            value: member.address || '—',
            icon: MapPin,
          },
        ]}
      />

      <MemberInfoSection
        title="Fitness Information"
        icon={Dumbbell}
        columns={3}
        items={[
          {
            label: 'Height',
            value: profile?.height
              ? `${profile.height} cm`
              : '—',
            icon: Ruler,
          },
          {
            label: 'Weight',
            value: profile?.weight
              ? `${profile.weight} kg`
              : '—',
            icon: Weight,
          },
          {
            label: 'BMI',
            value: profile?.bmi
              ? profile.bmi.toFixed(1)
              : '—',
            icon: HeartPulse,
          },
          {
            label: 'Fitness Goal',
            value: profile?.fitnessGoal || 'Not specified',
          },
          {
            label: 'Medical Conditions',
            value: medicalConditions,
          },
        ]}
      />

      <MemberInfoSection
        title="Branch & Assignment"
        icon={Building2}
        columns={2}
        items={[
          {
            label: 'Branch Name',
            value: branch?.name || '—',
            icon: Building2,
          },
          {
            label: 'Branch Location',
            value: branchAddress || '—',
            icon: MapPin,
          },
          {
            label: 'Assigned Trainer',
            value: trainer?.name || 'Not Assigned',
            icon: UserRound,
          },
          {
            label: 'Trainer Email',
            value: trainer?.email || '—',
            icon: Mail,
          },
          {
            label: 'Registration Date',
            value: formatDate(member.createdAt),
            icon: CalendarDays,
          },
        ]}
      />

      <MemberInfoSection
        title="Account Information"
        icon={ShieldCheck}
        columns={2}
        items={[
          {
            label: 'Account Email',
            value: user.email || '—',
            icon: Mail,
          },
          {
            label: 'Account Status',
            value: (
              <span
  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
    member.status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-orange-50 text-orange-700'
  }`}
>
  {member.status}
</span>
            ),
          },
          {
            label: 'User Role',
            value: user.role || 'MEMBER',
          },
          {
            label: 'Account Created',
            value: formatDate(user.createdAt),
            icon: CalendarDays,
          },
        ]}
      />
    </div>
  );
}