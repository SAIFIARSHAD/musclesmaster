
import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Snowflake,
  Unlock,
} from 'lucide-react';

import {
  getMembershipFreezeRequestsApi,
  getMembershipsApi,
  reviewMembershipFreezeRequestApi,
  unfreezeMembershipApi,
  type FreezeRequest,
  type Membership,
} from '../api/membership.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

type Tab = 'REQUESTS' | 'FROZEN';

const getErrorMessage = (error: any) =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong. Please try again.';

const formatDate = (date?: string | null) => {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getMemberName = (member: any) => {
  if (!member || typeof member !== 'object') return 'Unknown Member';

  return [member.firstName, member.lastName]
    .filter(Boolean)
    .join(' ') || member.memberId || 'Unknown Member';
};

export default function FreezeMembershipModal({
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('REQUESTS');
  const [requests, setRequests] = useState<FreezeRequest[]>([]);
  const [frozenMemberships, setFrozenMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedRequest, setSelectedRequest] =
    useState<FreezeRequest | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [requestResponse, membershipResponse] = await Promise.all([
        getMembershipFreezeRequestsApi({
          status: 'PENDING',
          page: 1,
          limit: 100,
        }),
        getMembershipsApi({
          status: 'FROZEN',
          page: 1,
          limit: 100,
        }),
      ]);

      setRequests(requestResponse.data || []);
      setFrozenMemberships(membershipResponse.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleReview = async (
    request: FreezeRequest,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    try {
      setActionId(request._id);
      setError('');

      await reviewMembershipFreezeRequestApi(request._id, {
        decision,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      setSelectedRequest(null);
      setReviewNotes('');

      await fetchData();
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId('');
    }
  };

  const handleUnfreeze = async (membershipId: string) => {
    try {
      setActionId(membershipId);
      setError('');

      await unfreezeMembershipApi(membershipId);

      await fetchData();
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#14243B]">
              Renewals & Freeze Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review member freeze requests and manage frozen memberships.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={21} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`border-b-2 py-4 text-sm font-semibold ${
                activeTab === 'REQUESTS'
                  ? 'border-[#F4510B] text-[#F4510B]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Pending Requests ({requests.length})
            </button>

            <button
              onClick={() => setActiveTab('FROZEN')}
              className={`border-b-2 py-4 text-sm font-semibold ${
                activeTab === 'FROZEN'
                  ? 'border-[#F4510B] text-[#F4510B]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Frozen Memberships ({frozenMemberships.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="mb-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-orange-500" />
            </div>
          ) : activeTab === 'REQUESTS' ? (
            requests.length === 0 ? (
              <div className="py-16 text-center">
                <Snowflake
                  size={38}
                  className="mx-auto mb-3 text-gray-300"
                />
                <p className="font-semibold text-gray-700">
                  No pending freeze requests
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  New member requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const membership = request.membershipId;
                  const member =
                    membership &&
                    typeof membership.memberId === 'object'
                      ? membership.memberId
                      : request.memberId;

                  const plan =
                    membership &&
                    typeof membership.planId === 'object'
                      ? membership.planId
                      : null;

                  return (
                    <div
                      key={request._id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-800">
                              {getMemberName(member)}
                            </h3>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              PENDING
                            </span>
                          </div>

                          <p className="text-sm text-gray-500">
                            Plan: {plan?.planName || '—'}
                          </p>

                          <p className="text-sm text-gray-500">
                            Requested: {request.requestedDays} days
                          </p>

                          <p className="text-sm text-gray-500">
                            Submitted: {formatDate(request.createdAt)}
                          </p>

                          <div className="mt-3 rounded-lg bg-gray-50 p-3">
                            <p className="text-xs font-semibold text-gray-500">
                              REASON
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              {request.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewNotes('');
                            }}
                            disabled={!!actionId}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 size={16} />
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : frozenMemberships.length === 0 ? (
            <div className="py-16 text-center">
              <Snowflake size={38} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">
                No frozen memberships
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Frozen memberships will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Member</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Frozen On</th>
                    <th className="px-5 py-4">Scheduled Unfreeze</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {frozenMemberships.map((membership) => {
                    const member =
                      typeof membership.memberId === 'object'
                        ? membership.memberId
                        : null;

                    const plan =
                      typeof membership.planId === 'object'
                        ? membership.planId
                        : null;

                    return (
                      <tr key={membership._id}>
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {getMemberName(member)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {plan?.planName || '—'}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(membership.frozenAt)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(membership.freezeEndDate)}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              handleUnfreeze(membership._id)
                            }
                            disabled={!!actionId}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                          >
                            {actionId === membership._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Unlock size={14} />
                            )}
                            Unfreeze
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedRequest && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#14243B]">
                  Review Freeze Request
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <span className="font-semibold">Requested days:</span>{' '}
                  {selectedRequest.requestedDays}
                </p>
                <p className="mt-2">
                  <span className="font-semibold">Reason:</span>{' '}
                  {selectedRequest.reason}
                </p>
              </div>

              <label className="mb-2 mt-4 block text-sm font-semibold text-gray-700">
                Review Notes
              </label>

              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Optional review notes..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
              />

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleReview(selectedRequest, 'REJECT')}
                  disabled={!!actionId}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>

                <button
                  onClick={() => handleReview(selectedRequest, 'APPROVE')}
                  disabled={!!actionId}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionId === selectedRequest._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
