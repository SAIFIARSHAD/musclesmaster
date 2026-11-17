import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Snowflake,
  X,
} from 'lucide-react';

import {
  getMembershipFreezeRequestsApi,
  reviewMembershipFreezeRequestApi,
} from '../api/memberships.api';

import type {
  FreezeRequestStatus,
  MembershipFreezeRequest,
  ReviewFreezeRequestPayload,
} from '../types/membership.types';

const statusStyles: Record<FreezeRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatDate = (date?: string) => {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getMemberName = (request: MembershipFreezeRequest) => {
  if (typeof request.memberId === 'string') {
    return 'Member information unavailable';
  }

  return `${request.memberId.firstName} ${request.memberId.lastName}`;
};

const getMemberCode = (request: MembershipFreezeRequest) => {
  if (typeof request.memberId === 'string') return '—';

  return request.memberId.memberId;
};

interface ReviewModalProps {
  request: MembershipFreezeRequest;
  decision: 'APPROVE' | 'REJECT';
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ReviewFreezeRequestPayload) => void;
}

const ReviewModal = ({
  request,
  decision,
  isSubmitting,
  onClose,
  onSubmit,
}: ReviewModalProps) => {
  const [reviewNotes, setReviewNotes] = useState('');

  const isApprove = decision === 'APPROVE';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      decision,
      reviewNotes: reviewNotes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div
              className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
                isApprove
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {isApprove ? <Check size={22} /> : <X size={22} />}
            </div>

            <h2 className="text-lg font-bold text-[#14243B]">
              {isApprove ? 'Approve Freeze Request' : 'Reject Freeze Request'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {getMemberName(request)} · {request.requestedDays} days
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Review Notes
          </label>

          <textarea
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Add a note for this decision (optional)..."
            className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#F4510B]"
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {reviewNotes.length}/500
          </p>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || reviewNotes.length > 500}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                isApprove
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting && (
                <RefreshCw size={15} className="animate-spin" />
              )}
              {isApprove ? 'Approve Request' : 'Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FreezeRequestsPage = () => {
  const [requests, setRequests] = useState<MembershipFreezeRequest[]>([]);
  const [status, setStatus] = useState<FreezeRequestStatus | ''>('PENDING');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedRequest, setSelectedRequest] =
    useState<MembershipFreezeRequest | null>(null);

  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getMembershipFreezeRequestsApi({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      });

      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Freeze requests fetch error:', err);
      setError('Unable to load freeze requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = (value: string) => {
    setStatus(value as FreezeRequestStatus | '');
    setPage(1);
  };

  const openReviewModal = (
    request: MembershipFreezeRequest,
    nextDecision: 'APPROVE' | 'REJECT',
  ) => {
    setSelectedRequest(request);
    setDecision(nextDecision);
  };

  const handleReview = async (payload: ReviewFreezeRequestPayload) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await reviewMembershipFreezeRequestApi(
        selectedRequest._id,
        payload,
      );

      setSuccessMessage(
        response.message ||
          `Freeze request ${payload.decision.toLowerCase()}d successfully.`,
      );

      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Freeze request review error:', err);
      setError('Unable to process this request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests.filter(
    (request) => request.status === 'PENDING',
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === 'APPROVED',
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === 'REJECTED',
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Snowflake className="text-[#F4510B]" size={25} />
            <h1 className="text-2xl font-bold text-[#14243B]">
              Membership Freeze Requests
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Review and manage member membership freeze requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchRequests()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isLoading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Pending on This Page
            </p>
            <Clock className="text-amber-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-[#14243B]">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Approved on This Page
            </p>
            <Check className="text-green-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-[#14243B]">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Rejected on This Page
            </p>
            <X className="text-red-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-[#14243B]">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Request Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              All Freeze Requests
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} requests found
            </p>
          </div>

          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
          >
            <option value="PENDING">Pending Requests</option>
            <option value="APPROVED">Approved Requests</option>
            <option value="REJECTED">Rejected Requests</option>
            <option value="CANCELLED">Cancelled Requests</option>
            <option value="">All Requests</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Member
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Requested Days
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submitted On
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto animate-spin text-[#F4510B]"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading freeze requests...
                    </p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm text-slate-500"
                  >
                    <Snowflake
                      size={32}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="font-semibold text-slate-700">
                      No freeze requests found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try changing the status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Member */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {getMemberName(request)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getMemberCode(request)}
                      </p>
                    </td>

                    {/* Days */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#14243B]">
                        {request.requestedDays} days
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="max-w-xs px-5 py-4">
                      <p
                        className="truncate text-sm text-slate-600"
                        title={request.reason}
                      >
                        {request.reason}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(request.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      {request.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openReviewModal(request, 'APPROVE')
                            }
                            className="rounded-lg bg-green-50 p-2 text-green-700 transition hover:bg-green-100"
                            title="Approve request"
                          >
                            <Check size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openReviewModal(request, 'REJECT')
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            title="Reject request"
                          >
                            <X size={17} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
              {' '}· {pagination.total} total requests
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          decision={decision}
          isSubmitting={isSubmitting}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
};

export default FreezeRequestsPage;
