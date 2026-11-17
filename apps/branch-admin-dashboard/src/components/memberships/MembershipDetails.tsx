
import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Loader2,
  RefreshCw,
  UserRound,
  CreditCard,
  CalendarDays,
  History,
  Snowflake,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { getMembershipByIdApi } from '../../api/memberships.api';

import type {
  Membership,
  MembershipHistory as MembershipHistoryType,
  MembershipStatus,
} from '../../types/membership.types';

interface MembershipDetailsProps {
  membershipId: string;
  onClose: () => void;
}

const MembershipDetails = ({
  membershipId,
  onClose,
}: MembershipDetailsProps) => {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [history, setHistory] = useState<MembershipHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await getMembershipByIdApi(membershipId);

      setMembership(response.data.membership);
      setHistory(response.data.history);
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

      setError(message || 'Unable to load membership details.');
    } finally {
      setIsLoading(false);
    }
  }, [membershipId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const formatDate = (date?: string) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const member =
    membership && typeof membership.memberId === 'object'
      ? membership.memberId
      : null;

  const plan =
    membership && typeof membership.planId === 'object'
      ? membership.planId
      : null;

  const branch =
    membership && typeof membership.branchId === 'object'
      ? membership.branchId
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#14243B]">
              Membership Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Membership information and complete activity history
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
                Loading membership details...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <p className="text-sm">{error}</p>
              </div>

              <button
                type="button"
                onClick={fetchDetails}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          ) : membership ? (
            <div className="space-y-6">
              {/* Membership Header */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-[#F4510B]">
                      <CreditCard size={23} />
                    </div>

                    <div>
                      <h3 className="font-bold text-[#14243B]">
                        {plan?.planName || 'Membership'}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {plan?.planType?.replaceAll('_', ' ') || 'Plan details'}
                      </p>
                    </div>
                  </div>

                  <MembershipStatusBadge status={membership.status} />
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">
                    Agreed Membership Amount
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#14243B]">
                    ₹{membership.agreedAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Member Information */}
              <DetailSection
                title="Member Information"
                icon={<UserRound size={18} />}
              >
                <DetailItem
                  label="Member Name"
                  value={
                    member
                      ? `${member.firstName} ${member.lastName}`
                      : 'Unavailable'
                  }
                />

                <DetailItem
                  label="Member ID"
                  value={member?.memberId || '—'}
                />

                <DetailItem
                  label="Mobile"
                  value={member?.mobile || '—'}
                />

                <DetailItem
                  label="Email"
                  value={member?.email || '—'}
                />
              </DetailSection>

              {/* Plan Information */}
              <DetailSection
                title="Plan Information"
                icon={<CreditCard size={18} />}
              >
                <DetailItem
                  label="Plan Name"
                  value={plan?.planName || '—'}
                />

                <DetailItem
                  label="Plan Type"
                  value={plan?.planType?.replaceAll('_', ' ') || '—'}
                />

                <DetailItem
                  label="Plan Duration"
                  value={plan ? `${plan.duration} days` : '—'}
                />

                <DetailItem
                  label="Personal Training"
                  value={plan ? (plan.ptIncluded ? 'Included' : 'Not Included') : '—'}
                />

                <DetailItem
                  label="Branch"
                  value={branch?.name || '—'}
                />

                <DetailItem
                  label="Branch Code"
                  value={branch?.code || '—'}
                />
              </DetailSection>

              {/* Duration Information */}
              <DetailSection
                title="Membership Duration"
                icon={<CalendarDays size={18} />}
              >
                <DetailItem
                  label="Start Date"
                  value={formatDate(membership.startDate)}
                />

                <DetailItem
                  label="Expiry Date"
                  value={formatDate(membership.endDate)}
                />

                <DetailItem
                  label="Activated On"
                  value={formatDate(membership.activatedAt)}
                />

                <DetailItem
                  label="Created On"
                  value={formatDate(membership.createdAt)}
                />
              </DetailSection>

              {/* Freeze Information */}
              <DetailSection
                title="Freeze Information"
                icon={<Snowflake size={18} />}
              >
                <DetailItem
                  label="Total Freeze Days"
                  value={`${membership.freezeDays || 0} days`}
                />

                <DetailItem
                  label="Frozen Since"
                  value={formatDate(membership.frozenAt)}
                />

                <DetailItem
                  label="Scheduled Unfreeze"
                  value={formatDate(membership.freezeEndDate)}
                />
              </DetailSection>

              {/* Membership History */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <History size={19} className="text-[#F4510B]" />

                  <h3 className="text-sm font-bold text-[#14243B]">
                    Membership History
                  </h3>

                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {history.length} Records
                  </span>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-xl border border-slate-100 p-6 text-center">
                    <History
                      size={27}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm text-slate-500">
                      No membership history available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item._id}
                        className="relative border-l-2 border-orange-100 pl-5"
                      >
                        <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-[#F4510B] bg-white" />

                        <div className="rounded-xl border border-slate-100 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#14243B]">
                              {item.action.replaceAll('_', ' ')}
                            </p>

                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={13} />
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.previousStatus && (
                              <StatusLabel status={item.previousStatus} />
                            )}

                            {item.previousStatus && item.newStatus && (
                              <span className="text-xs text-slate-400">
                                →
                              </span>
                            )}

                            {item.newStatus && (
                              <StatusLabel status={item.newStatus} />
                            )}
                          </div>

                          {item.notes && (
                            <p className="mt-3 text-sm text-slate-600">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
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
  );
};

const DetailSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[#F4510B]">{icon}</span>

      <h3 className="text-sm font-bold text-[#14243B]">
        {title}
      </h3>
    </div>

    <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2">
      {children}
    </div>
  </section>
);

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <p className="mb-1 text-xs text-slate-400">{label}</p>
    <p className="break-words text-sm font-medium text-slate-700">
      {value}
    </p>
  </div>
);

const MembershipStatusBadge = ({
  status,
}: {
  status: MembershipStatus;
}) => {
  const styles: Record<MembershipStatus, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    PENDING: 'bg-orange-50 text-orange-700',
    EXPIRED: 'bg-slate-100 text-slate-600',
    FROZEN: 'bg-blue-50 text-blue-700',
  };

  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};

const StatusLabel = ({
  status,
}: {
  status: MembershipStatus;
}) => (
  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
    {status}
  </span>
);

export default MembershipDetails;
