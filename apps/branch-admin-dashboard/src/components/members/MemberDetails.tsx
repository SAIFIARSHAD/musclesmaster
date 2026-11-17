import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  CreditCard,
  Loader2,
  UserRound,
  Pencil,
  RefreshCw,
} from 'lucide-react';

import { getMemberByIdApi } from '../../api/members.api';
import { getMembershipsApi } from '../../api/memberships.api';

import MemberEditForm from './MemberEditForm';
import TrainerAssignment from './TrainerAssignment';
import MembershipAssignment from './MembershipAssignment';
import MembershipRenewal from './MembershipRenewal';

import type {
  MemberDetailsResponse,
  MemberStatus,
} from '../../types/member.types';

import type { Membership } from '../../types/membership.types';

interface MemberDetailsProps {
  memberId: string;
  onClose: () => void;
}

const MemberDetails = ({
  memberId,
  onClose,
}: MemberDetailsProps) => {
  const [details, setDetails] =
    useState<MemberDetailsResponse['data'] | null>(null);

  const [membership, setMembership] = useState<Membership | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [error, setError] = useState('');

  // Fetch member and membership information.
  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [memberResponse, membershipResponse] =
        await Promise.all([
          getMemberByIdApi(memberId),
          getMembershipsApi({
            memberId,
            page: 1,
            limit: 10,
          }),
        ]);

      setDetails(memberResponse.data);

      const currentMembership =
  membershipResponse.data.find((item) =>
    ['ACTIVE', 'PENDING', 'FROZEN'].includes(item.status),
  ) ||
  membershipResponse.data.find(
    (item) => item.status === 'EXPIRED',
  ) ||
  null;

setMembership(currentMembership);
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

      setError(message || 'Unable to load member details.');
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const formatDate = (date?: string) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const member = details?.member;
  const profile = details?.profile;
  const branch = details?.branch;
  const trainer = details?.trainer;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
        <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#14243B]">
                Member Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Complete member profile and membership information
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">

            {isLoading ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center">
                <Loader2
                  size={30}
                  className="animate-spin text-[#F4510B]"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading member profile...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>

                <button
                  type="button"
                  onClick={fetchDetails}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            ) : member ? (
              <div className="space-y-6">

                {/* Profile Header */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-xl font-bold text-[#F4510B]">
                      {member.firstName?.charAt(0)}
                      {member.lastName?.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-[#14243B]">
                        {member.firstName} {member.lastName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Member ID: {member.memberId}
                      </p>

                      <div className="mt-2">
                        <StatusBadge status={member.status} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#dc4508]"
                    >
                      <Pencil size={16} />
                      Edit Member
                    </button>
                  </div>
                </div>

                {/* Personal Information */}
                <DetailSection
                  title="Personal Information"
                  icon={<User size={18} />}
                >
                  <DetailItem
                    label="Full Name"
                    value={`${member.firstName} ${member.lastName}`}
                  />

                  <DetailItem
                    label="Gender"
                    value={member.gender}
                  />

                  <DetailItem
                    label="Date of Birth"
                    value={formatDate(member.dob)}
                  />

                  <DetailItem
                    label="Registration Date"
                    value={formatDate(member.createdAt)}
                  />
                </DetailSection>

                {/* Contact Information */}
                <DetailSection
                  title="Contact Information"
                  icon={<Phone size={18} />}
                >
                  <DetailItem
                    label="Mobile"
                    value={member.mobile}
                    icon={<Phone size={15} />}
                  />

                  <DetailItem
                    label="Email"
                    value={
                      details.user?.email ||
                      member.email ||
                      '—'
                    }
                    icon={<Mail size={15} />}
                  />

                  <DetailItem
                    label="Address"
                    value={member.address || 'Not provided'}
                    icon={<MapPin size={15} />}
                    fullWidth
                  />
                </DetailSection>

                {/* Fitness Information */}
                <DetailSection
                  title="Fitness Information"
                  icon={<Activity size={18} />}
                >
                  <DetailItem
                    label="Height"
                    value={
                      profile?.height
                        ? `${profile.height} cm`
                        : '—'
                    }
                  />

                  <DetailItem
                    label="Weight"
                    value={
                      profile?.weight
                        ? `${profile.weight} kg`
                        : '—'
                    }
                  />

                  <DetailItem
                    label="BMI"
                    value={profile?.bmi?.toString() || '—'}
                  />

                  <DetailItem
                    label="Fitness Goal"
                    value={profile?.fitnessGoal || 'Not provided'}
                    fullWidth
                  />

                  <DetailItem
                    label="Medical Conditions"
                    value={
                      profile?.medicalConditions?.length
                        ? profile.medicalConditions.join(', ')
                        : 'None provided'
                    }
                    fullWidth
                  />
                </DetailSection>

                {/* Branch & Trainer */}
                <DetailSection
                  title="Branch & Trainer"
                  icon={<UserRound size={18} />}
                >
                  <DetailItem
                    label="Branch"
                    value={branch?.name || '—'}
                  />

                  <DetailItem
                    label="Branch Code"
                    value={branch?.code || '—'}
                  />

                  <DetailItem
                    label="Assigned Trainer"
                    value={trainer?.name || 'Not assigned'}
                    fullWidth
                  />
                </DetailSection>

                {/* Trainer Assignment */}
                {member && (
                <TrainerAssignment
                memberId={member._id}
                currentTrainer={
                trainer
                ? {
                    _id: trainer._id,
                    name: trainer.name,
                    }
                : null
                }
                onSuccess={fetchDetails}
                />
                )}

                {/* Membership Assignment */}
                {member && !membership &&(
                <MembershipAssignment
                 memberId={member._id}
                 onSuccess={fetchDetails}
                    />
                    )}    


                {/* Membership Information */}
                <DetailSection
                  title="Membership Information"
                  icon={<CreditCard size={18} />}
                >
                  {membership ? (
                    <>
                      <DetailItem
                        label="Membership Plan"
                        value={
                          typeof membership.planId === 'object'
                            ? membership.planId.planName
                            : 'Plan information unavailable'
                        }
                      />

                      <DetailItem
                        label="Agreed Amount"
                        value={`₹${membership.agreedAmount.toLocaleString('en-IN')}`}
                      />

                      <DetailItem
                        label="Start Date"
                        value={formatDate(membership.startDate)}
                      />

                      <DetailItem
                        label="Expiry Date"
                        value={formatDate(membership.endDate)}
                      />

                      <DetailItem
                        label="Freeze Days"
                        value={String(membership.freezeDays || 0)}
                      />

                      <DetailItem
                        label="Membership Status"
                        value={membership.status}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No current or pending membership found.
                    </p>
                  )}
                </DetailSection>

                {/* Membership Renewal */}
                {membership &&
                ['ACTIVE', 'EXPIRED'].includes(membership.status) && (
                <MembershipRenewal
                    membership={membership}
                    onSuccess={fetchDetails}
                />
                )}

              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#14243B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#203957]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      {isEditOpen && member && (
        <MemberEditForm
          member={member}
          profile={profile ?? null}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchDetails}
        />
      )}
    </>
  );
};

// Detail Section
const DetailSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[#F4510B]">{icon}</span>

      <h3 className="text-sm font-bold text-[#14243B]">
        {title}
      </h3>
    </div>

    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-2">
      {children}
    </div>
  </section>
);

// Detail Item
const DetailItem = ({
  label,
  value,
  icon,
  fullWidth = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}) => (
  <div className={fullWidth ? 'sm:col-span-2' : ''}>
    <p className="mb-1 text-xs text-slate-400">{label}</p>

    <div className="flex items-start gap-2 text-sm font-medium text-slate-700">
      {icon && (
        <span className="mt-0.5 text-slate-400">{icon}</span>
      )}

      <span className="break-words">{value}</span>
    </div>
  </div>
);

// Status Badge
const StatusBadge = ({
  status,
}: {
  status: MemberStatus;
}) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      status === 'ACTIVE'
        ? 'bg-green-50 text-green-700'
        : 'bg-orange-50 text-orange-700'
    }`}
  >
    {status}
  </span>
);

export default MemberDetails;
