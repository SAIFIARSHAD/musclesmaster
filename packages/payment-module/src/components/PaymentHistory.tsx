import { useCallback, useEffect, useState } from 'react';
import { usePaymentModule } from '../hooks/usePaymentModule';
import type {
  Payment,
  PaymentPagination,
  PaymentHistoryFilters,
  PaymentStatus,
  PaymentType,
} from '../types/payment.types';

type AuditRecord = {
  _id?: string;
  action?: string;
  createdAt?: string;
  performedBy?: string;
  actorId?: string;
  userId?: string;
  changes?: unknown;
  metadata?: unknown;
  [key: string]: unknown;
};

type AuditResponse = {
  success?: boolean;
  message?: string;
  data?: AuditRecord[];
  pagination?: PaymentPagination;
};

const currency = (amount: number, currencyCode = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const dateTimeLabel = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const dateOnly = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const initialFilters = {
  memberId: '',
  status: '',
  paymentType: '',
  fromDate: '',
  toDate: '',
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E2E7EF',
  borderRadius: '12px',
  padding: '20px',
  minWidth: 0,
  boxShadow: '0 2px 8px rgba(21, 40, 64, 0.04)',
};

const mutedStyle = {
  color: '#718096',
  fontSize: '13px',
};

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  marginTop: '6px',
  padding: '10px 11px',
  border: '1px solid #D1D5DB',
  borderRadius: '7px',
  background: '#FFFFFF',
  color: '#152840',
  fontSize: '13px',
};

const buttonStyle = {
  padding: '9px 14px',
  border: '1px solid #D1D5DB',
  borderRadius: '7px',
  background: '#FFFFFF',
  color: '#152840',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const primaryButtonStyle = {
  ...buttonStyle,
  border: 0,
  background: '#F4510B',
  color: '#FFFFFF',
};

const cellStyle = {
  padding: '13px 12px',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap' as const,
  fontSize: '13px',
};

const statusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'SUCCESS':
      return { background: '#DCFCE7', color: '#166534' };
    case 'PENDING':
      return { background: '#FEF3C7', color: '#92400E' };
    case 'FAILED':
      return { background: '#FEE2E2', color: '#991B1B' };
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return { background: '#EDE9FE', color: '#5B21B6' };
    default:
      return { background: '#F1F5F9', color: '#475569' };
  }
};

const displayText = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
};

export const PaymentHistory = () => {
  const { payments, invoices } = usePaymentModule();

  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const [records, setRecords] = useState<Payment[]>([]);
  const [pagination, setPagination] =
    useState<PaymentPagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditPagination, setAuditPagination] =
    useState<PaymentPagination | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const requestFilters: PaymentHistoryFilters = {
        page,
        limit: 10,
        ...(filters.memberId.trim()
          ? { memberId: filters.memberId.trim() }
          : {}),
        ...(filters.status
          ? { status: filters.status as PaymentStatus }
          : {}),
        ...(filters.paymentType
          ? { paymentType: filters.paymentType as PaymentType }
          : {}),
        ...(filters.fromDate
          ? { fromDate: filters.fromDate }
          : {}),
        ...(filters.toDate
          ? { toDate: filters.toDate }
          : {}),
      };

      const response = await payments.getPaymentHistory(requestFilters);

      if (!response.success) {
        throw new Error(response.message || 'Unable to load payment history.');
      }

      setRecords(response.data || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payment history.',
      );
    } finally {
      setLoading(false);
    }
  }, [payments, filters, page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const loadAuditHistory = async (paymentId: string) => {
    try {
      setAuditLoading(true);
      setAuditError('');
      setAuditRecords([]);
      setAuditPagination(null);

      const response =
        (await payments.getPaymentAuditHistory(paymentId, {
          page: 1,
          limit: 20,
        })) as AuditResponse;

      if (response.success === false) {
        throw new Error(response.message || 'Unable to load audit history.');
      }

      setAuditRecords(response.data || []);
      setAuditPagination(response.pagination || null);
    } catch (err) {
      setAuditError(
        err instanceof Error
          ? err.message
          : 'Unable to load audit history.',
      );
    } finally {
      setAuditLoading(false);
    }
  };

  const openDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setInvoiceMessage('');
    void loadAuditHistory(payment._id);
  };

  const applyFilters = () => {
    if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
      setError('From date cannot be later than to date.');
      return;
    }

    setPage(1);
    setFilters({ ...draft });
  };

  const resetFilters = () => {
    setDraft(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };


const downloadInvoice = async (
  invoiceId: string,
  invoiceNumber: string,
) => {
  let fileUrl: string | undefined;

  try {
    setInvoiceLoading(true);
    setInvoiceMessage('');

    const blob = await invoices.downloadInvoicePdf(invoiceId);

    if (!blob || blob.size === 0) {
      throw new Error('Invoice PDF is empty.');
    }

    fileUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = fileUrl;

    const safeInvoiceNumber = invoiceNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );

    anchor.download = `${safeInvoiceNumber}.pdf`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

  } catch (err) {
    setInvoiceMessage(
      err instanceof Error
        ? err.message
        : 'Unable to download invoice PDF.',
    );
  } finally {
    setInvoiceLoading(false);

    if (fileUrl) {
      const urlToRevoke = fileUrl;

      window.setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
      }, 1000);
    }
  }
};



type PaymentWithInvoice = Payment & {
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: string | null;
};

const getInvoiceInfo = (payment: Payment) => {
  const extendedPayment = payment as PaymentWithInvoice;

  return {
    id: extendedPayment.invoiceId || undefined,
    number: extendedPayment.invoiceNumber || 'invoice',
  };
};


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, color: '#152840', fontSize: '22px', fontWeight: 700 }}>
          Payment History
        </h2>
        <p style={{ ...mutedStyle, marginTop: '6px' }}>
          Search and review payment transactions, details and audit activity.
        </p>
      </div>

      <section style={cardStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            alignItems: 'end',
          }}
        >
          <label style={mutedStyle}>
            Member ID
            <input
              value={draft.memberId}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  memberId: event.target.value,
                }))
              }
              placeholder="Enter member ID"
              style={inputStyle}
            />
          </label>

          <label style={mutedStyle}>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="PARTIALLY_REFUNDED">Partially refunded</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </label>

          <label style={mutedStyle}>
            Payment type
            <select
              value={draft.paymentType}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  paymentType: event.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="">All types</option>
              <option value="MEMBERSHIP">Membership</option>
              <option value="PERSONAL_TRAINING">Personal training</option>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </select>
          </label>

          <label style={mutedStyle}>
            From date
            <input
              type="date"
              value={draft.fromDate}
              max={draft.toDate || undefined}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  fromDate: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>

          <label style={mutedStyle}>
            To date
            <input
              type="date"
              value={draft.toDate}
              min={draft.fromDate || undefined}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  toDate: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              style={primaryButtonStyle}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              disabled={loading}
              style={buttonStyle}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 15px',
            borderRadius: '8px',
            background: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '13px',
          }}
        >
          {error}
          <button
            type="button"
            onClick={() => void loadHistory()}
            style={{
              marginLeft: '10px',
              border: 0,
              background: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <section style={{ ...cardStyle, overflowX: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <strong style={{ color: '#152840' }}>Transactions</strong>
          <span style={mutedStyle}>
            {pagination?.totalRecords ?? 0} records
          </span>
        </div>

        {loading ? (
          <p style={mutedStyle}>Loading payment history...</p>
        ) : records.length === 0 ? (
          <div style={{ padding: '30px 10px', textAlign: 'center' }}>
            <strong style={{ color: '#152840' }}>No payments found</strong>
            <p style={{ ...mutedStyle, marginTop: '6px' }}>
              Try changing the filters or date range.
            </p>
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              minWidth: '900px',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: '#F4F6FA' }}>
                {[
                  'Payment Reference',
                  'Member ID',
                  'Type',
                  'Method',
                  'Date',
                  'Status',
                  'Amount',
                  'Details',
                ].map((heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {records.map((payment) => (
                <tr key={payment._id}>
                  <td style={cellStyle}>
                    <strong style={{ color: '#152840' }}>
                      {payment.paymentReference}
                    </strong>
                  </td>
                  <td style={cellStyle}>{payment.memberId}</td>
                  <td style={cellStyle}>
                    {payment.paymentType.replace(/_/g, ' ')}
                  </td>
                  <td style={cellStyle}>
                    {payment.paymentMethod.replace(/_/g, ' ')}
                  </td>
                  <td style={cellStyle}>
                    {dateTimeLabel(payment.paidAt || payment.createdAt)}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        ...statusColor(payment.status),
                      }}
                    >
                      {payment.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <strong>{currency(payment.amount, payment.currency)}</strong>
                  </td>
                  <td style={cellStyle}>
                    <button
                      type="button"
                      onClick={() => openDetails(payment)}
                      style={primaryButtonStyle}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '18px',
            }}
          >
            <span style={mutedStyle}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={loading || !pagination.hasPreviousPage}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                style={{
                  ...buttonStyle,
                  opacity: loading || !pagination.hasPreviousPage ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || !pagination.hasNextPage}
                onClick={() => setPage((previous) => previous + 1)}
                style={{
                  ...buttonStyle,
                  opacity: loading || !pagination.hasNextPage ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedPayment && (
        <div
          role="presentation"
          onClick={() => setSelectedPayment(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.55)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Payment transaction details"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '15px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#152840' }}>
                  Transaction Details
                </h3>
                <p style={{ ...mutedStyle, marginTop: '5px' }}>
                  {selectedPayment.paymentReference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                style={buttonStyle}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              {[
                ['Payment ID', selectedPayment._id],
                ['Member ID', selectedPayment.memberId],
                ['Branch ID', selectedPayment.branchId],
                ['Membership ID', selectedPayment.membershipId || '—'],
                ['Payment Type', selectedPayment.paymentType.replace(/_/g, ' ')],
                ['Payment Method', selectedPayment.paymentMethod.replace(/_/g, ' ')],
                ['Status', selectedPayment.status.replace(/_/g, ' ')],
                ['Amount', currency(selectedPayment.amount, selectedPayment.currency)],
                ['Transaction ID', selectedPayment.transactionId || '—'],
                ['Payment Date', dateTimeLabel(selectedPayment.paidAt)],
                ['Created At', dateTimeLabel(selectedPayment.createdAt)],
                ['Notes', selectedPayment.notes || '—'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: '12px',
                    border: '1px solid #E2E7EF',
                    borderRadius: '8px',
                    minWidth: 0,
                  }}
                >
                  <div style={mutedStyle}>{label}</div>
                  <div
                    style={{
                      marginTop: '6px',
                      color: '#152840',
                      fontSize: '13px',
                      fontWeight: 600,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>

                   {(() => {
  const invoice = getInvoiceInfo(selectedPayment);

  return invoice.id ? (
    <button
      type="button"
      disabled={invoiceLoading}
      onClick={() => {
        if (!invoice.id) return;

        void downloadInvoice(invoice.id, invoice.number);
      }}
      style={{
        ...primaryButtonStyle,
        opacity: invoiceLoading ? 0.6 : 1,
      }}
    >
      {invoiceLoading
        ? 'Downloading...'
        : 'Download Invoice PDF'}
    </button>
  ) : (
    <p style={{ ...mutedStyle, margin: 0 }}>
      Invoice is not available for this payment.
    </p>
  );
})()}
              {invoiceMessage && (
                <p role="alert" style={{ color: '#B91C1C', fontSize: '13px' }}>
                  {invoiceMessage}
                </p>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ margin: '0 0 12px', color: '#152840', fontSize: '16px' }}>
                Audit History
              </h4>

              {auditLoading ? (
                <p style={mutedStyle}>Loading audit history...</p>
              ) : auditError ? (
                <p role="alert" style={{ color: '#B91C1C', fontSize: '13px' }}>
                  {auditError}
                  <button
                    type="button"
                    onClick={() => void loadAuditHistory(selectedPayment._id)}
                    style={{
                      ...buttonStyle,
                      marginLeft: '8px',
                    }}
                  >
                    Retry
                  </button>
                </p>
              ) : auditRecords.length === 0 ? (
                <p style={mutedStyle}>No audit records found for this transaction.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {auditRecords.map((record, index) => (
                    <div
                      key={record._id || `${record.createdAt || 'audit'}-${index}`}
                      style={{
                        border: '1px solid #E2E7EF',
                        borderRadius: '9px',
                        padding: '13px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <strong style={{ color: '#152840', fontSize: '13px' }}>
                          {displayText(record.action)}
                        </strong>
                        <span style={mutedStyle}>
                          {dateTimeLabel(record.createdAt)}
                        </span>
                      </div>

                      <p style={{ ...mutedStyle, margin: '7px 0' }}>
                        Actor: {displayText(
                          record.performedBy || record.actorId || record.userId,
                        )}
                      </p>

                      {Boolean(record.changes || record.metadata) && (
                        <pre
                          style={{
                            margin: '8px 0 0',
                            padding: '10px',
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            color: '#334155',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {displayText(record.changes ?? record.metadata)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {auditPagination && auditPagination.totalRecords > 20 && (
                <p style={{ ...mutedStyle, marginTop: '10px' }}>
                  Showing first 20 of {auditPagination.totalRecords} audit records.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};