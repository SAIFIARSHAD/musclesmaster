
import { useCallback, useEffect, useState } from 'react';
import { usePaymentModule } from '../hooks/usePaymentModule';
import type {
  PaymentDashboardSummary,
  OutstandingDue,
  PaymentPagination,
} from '../types/payment.types';

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const dateLabel = (value?: string | null) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const currentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`,
  };
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

const headingStyle = {
  color: '#152840',
  fontSize: '22px',
  fontWeight: 700,
  margin: 0,
};

export const PaymentDashboard = () => {
  const { payments } = usePaymentModule();

  const [summary, setSummary] =
    useState<PaymentDashboardSummary | null>(null);

  const [filters, setFilters] = useState(currentMonthRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Outstanding dues state
  const [outstandingDues, setOutstandingDues] =
    useState<OutstandingDue[]>([]);

  const [duesPagination, setDuesPagination] =
    useState<PaymentPagination | null>(null);

  const [duesPage, setDuesPage] = useState(1);
  const [duesLoading, setDuesLoading] = useState(false);
  const [duesError, setDuesError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await payments.getDashboardSummary(filters);

      if (!response.success) {
        throw new Error(response.message || 'Unable to load dashboard.');
      }

      setSummary(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payment dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }, [payments, filters]);

  const loadOutstandingDues = useCallback(async () => {
    try {
      setDuesLoading(true);
      setDuesError('');

      const response = await payments.getOutstandingDues({
        page: duesPage,
        limit: 10,
      });

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to load outstanding dues.',
        );
      }

      setOutstandingDues(response.data || []);
      setDuesPagination(response.pagination || null);
    } catch (err) {
      setDuesError(
        err instanceof Error
          ? err.message
          : 'Unable to load outstanding dues.',
      );
    } finally {
      setDuesLoading(false);
    }
  }, [payments, duesPage]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadOutstandingDues();
  }, [loadOutstandingDues]);

  const updateFilter = (
    field: 'fromDate' | 'toDate',
    value: string,
  ) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    if (
      filters.fromDate &&
      filters.toDate &&
      filters.fromDate > filters.toDate
    ) {
      setError('From date cannot be later than to date.');
      return;
    }

    void loadDashboard();
  };

  const cards = summary
    ? [
        {
          label: 'Total Collection',
          value: currency(summary.collection.totalCollected),
          detail: `${summary.collection.totalTransactions} transactions`,
        },
        {
          label: "Today's Collection",
          value: currency(summary.collection.todayCollection),
          detail: `${summary.collection.todayTransactions} transactions today`,
        },
        {
          label: 'Net Collection',
          value: currency(summary.collection.netCollection),
          detail: 'After processed refunds',
        },
        {
          label: 'Outstanding Dues',
          value: currency(summary.dues.totalPendingDue),
          detail: `${summary.dues.pendingMemberships} pending memberships`,
        },
        {
          label: 'Total Refunds',
          value: currency(summary.collection.totalRefunded),
          detail: 'Successfully processed',
        },
        {
          label: 'Pending Refund Requests',
          value: String(summary.refunds.pendingRequests),
          detail: `${summary.refunds.approvedRequests} approved requests`,
        },
      ]
    : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        color: '#111827',
      }}
    >
      {/* Dashboard Header and Date Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={headingStyle}>Payment Dashboard</h2>
          <p style={{ ...mutedStyle, marginTop: '6px' }}>
            Monitor collections, outstanding dues and refunds.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'end',
            gap: '10px',
          }}
        >
          <label style={mutedStyle}>
            From date
            <input
              type="date"
              value={filters.fromDate}
              max={filters.toDate}
              onChange={(event) =>
                updateFilter('fromDate', event.target.value)
              }
              style={inputStyle}
            />
          </label>

          <label style={mutedStyle}>
            To date
            <input
              type="date"
              value={filters.toDate}
              min={filters.fromDate}
              onChange={(event) =>
                updateFilter('toDate', event.target.value)
              }
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Dashboard Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: '14px',
          }}
        >
          {error}
          <button
            type="button"
            onClick={() => void loadDashboard()}
            style={{
              marginLeft: '12px',
              textDecoration: 'underline',
              background: 'none',
              border: 0,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !summary ? (
        <div style={cardStyle}>Loading payment dashboard...</div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            {cards.map((card) => (
              <div key={card.label} style={cardStyle}>
                <div style={mutedStyle}>{card.label}</div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: '12px 0 6px',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {card.value}
                </div>
                <div style={mutedStyle}>{card.detail}</div>
              </div>
            ))}
          </div>

          {/* Outstanding Dues */}
          <section style={{ ...cardStyle, overflowX: 'auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#152840' }}>
                  Outstanding Dues
                </h3>
                <p style={{ ...mutedStyle, marginTop: '5px' }}>
                  Members with pending membership payments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadOutstandingDues()}
                disabled={duesLoading}
                style={{
                  ...buttonStyle,
                  background: '#152840',
                  opacity: duesLoading ? 0.65 : 1,
                }}
              >
                {duesLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {duesError && (
              <div
                role="alert"
                style={{
                  padding: '12px',
                  marginBottom: '14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {duesError}
                <button
                  type="button"
                  onClick={() => void loadOutstandingDues()}
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

            {duesLoading && outstandingDues.length === 0 ? (
              <p style={mutedStyle}>Loading outstanding dues...</p>
            ) : outstandingDues.length === 0 ? (
              <div
                style={{
                  padding: '30px 15px',
                  textAlign: 'center',
                  color: '#718096',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                  ✓
                </div>
                <strong style={{ color: '#152840' }}>
                  No outstanding dues found
                </strong>
                <p style={{ ...mutedStyle, marginTop: '6px' }}>
                  All memberships are fully paid or no pending dues exist.
                </p>
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px',
                  minWidth: '950px',
                }}
              >
                <thead>
                  <tr style={{ background: '#F4F6FA' }}>
                    {[
                      'Member',
                      'Member ID',
                      'Mobile',
                      'Agreed Amount',
                      'Collected',
                      'Refunded',
                      'Remaining Due',
                      'Action',
                    ].map((heading) => (
                      <th key={heading} style={tableCellStyle}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {outstandingDues.map((due) => (
                    <tr key={due.membershipId}>
                      <td style={tableCellStyle}>
                        <strong style={{ color: '#152840' }}>
                          {due.member.firstName} {due.member.lastName}
                        </strong>
                      </td>

                      <td style={tableCellStyle}>
                        {due.member.memberId}
                      </td>

                      <td style={tableCellStyle}>
                        {due.member.mobile}
                      </td>

                      <td style={tableCellStyle}>
                        {currency(due.agreedAmount)}
                      </td>

                      <td style={tableCellStyle}>
                        {currency(due.totalCollected)}
                      </td>

                      <td style={tableCellStyle}>
                        {currency(due.totalRefunded)}
                      </td>

                      <td style={tableCellStyle}>
                        <strong style={{ color: '#DC2626' }}>
                          {currency(due.remainingDue)}
                        </strong>
                      </td>

                      <td style={tableCellStyle}>
                        <a
                          href="/payments/collect"
                          style={{
                            display: 'inline-block',
                            padding: '8px 12px',
                            background: '#FF500A',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Collect Payment
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Outstanding Dues Pagination */}
            {duesPagination && duesPagination.totalPages > 1 && (
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
                  Page {duesPagination.currentPage} of{' '}
                  {duesPagination.totalPages} ·{' '}
                  {duesPagination.totalRecords} records
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={
                      duesLoading ||
                      !duesPagination.hasPreviousPage
                    }
                    onClick={() =>
                      setDuesPage((previous) => Math.max(1, previous - 1))
                    }
                    style={{
                      ...paginationButtonStyle,
                      opacity:
                        !duesPagination.hasPreviousPage || duesLoading
                          ? 0.5
                          : 1,
                    }}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      duesLoading ||
                      !duesPagination.hasNextPage
                    }
                    onClick={() =>
                      setDuesPage((previous) => previous + 1)
                    }
                    style={{
                      ...paginationButtonStyle,
                      opacity:
                        !duesPagination.hasNextPage || duesLoading
                          ? 0.5
                          : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Payment Methods and Refund Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <section style={cardStyle}>
              <h3 style={{ margin: '0 0 18px', fontSize: '16px' }}>
                Payment Methods
              </h3>

              {summary.paymentMethods.length === 0 ? (
                <p style={mutedStyle}>No payment data for this period.</p>
              ) : (
                summary.paymentMethods.map((item) => {
                  const percentage =
                    summary.collection.totalCollected > 0
                      ? (item.amount /
                          summary.collection.totalCollected) *
                        100
                      : 0;

                  return (
                    <div
                      key={item.method}
                      style={{ marginBottom: '18px' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '7px',
                          fontSize: '14px',
                        }}
                      >
                        <strong>{item.method.replace('_', ' ')}</strong>
                        <span>{currency(item.amount)}</span>
                      </div>

                      <div
                        style={{
                          height: '8px',
                          background: '#e5e7eb',
                          borderRadius: '20px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(percentage, 100)}%`,
                            background: '#FF500A',
                            borderRadius: '20px',
                          }}
                        />
                      </div>

                      <div style={{ ...mutedStyle, marginTop: '5px' }}>
                        {item.count} transactions
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section style={cardStyle}>
              <h3 style={{ margin: '0 0 18px', fontSize: '16px' }}>
                Refund Overview
              </h3>

              <div style={summaryRowStyle}>
                <span>Pending requests</span>
                <strong>{summary.refunds.pendingRequests}</strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Pending amount</span>
                <strong>{currency(summary.refunds.pendingAmount)}</strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Approved requests</span>
                <strong>{summary.refunds.approvedRequests}</strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Approved amount</span>
                <strong>{currency(summary.refunds.approvedAmount)}</strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Processed amount</span>
                <strong>{currency(summary.refunds.processedAmount)}</strong>
              </div>
            </section>
          </div>

          {/* Recent Transactions */}
          <section style={{ ...cardStyle, overflowX: 'auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Recent Transactions
              </h3>

              <span style={mutedStyle}>
                Latest 10 transactions
              </span>
            </div>

            {summary.recentTransactions.length === 0 ? (
              <p style={mutedStyle}>
                No transactions found for this period.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px',
                  minWidth: '650px',
                }}
              >
                <thead>
                  <tr style={{ background: '#F4F6FA' }}>
                    {[
                      'Reference',
                      'Type',
                      'Method',
                      'Date',
                      'Status',
                      'Amount',
                    ].map((heading) => (
                      <th key={heading} style={tableCellStyle}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {summary.recentTransactions.map((payment) => (
                    <tr key={payment._id}>
                      <td style={tableCellStyle}>
                        {payment.paymentReference}
                      </td>

                      <td style={tableCellStyle}>
                        {payment.paymentType.replace('_', ' ')}
                      </td>

                      <td style={tableCellStyle}>
                        {payment.paymentMethod.replace('_', ' ')}
                      </td>

                      <td style={tableCellStyle}>
                        {dateLabel(payment.paidAt)}
                      </td>

                      <td style={tableCellStyle}>
                        {payment.status}
                      </td>

                      <td style={tableCellStyle}>
                        <strong>{currency(payment.amount)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : (
        !error && (
          <div style={cardStyle}>No dashboard data available.</div>
        )
      )}
    </div>
  );
};

const inputStyle = {
  display: 'block',
  marginTop: '6px',
  padding: '9px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '7px',
  background: '#ffffff',
  color: '#152840',
  fontSize: '13px',
};

const buttonStyle = {
  padding: '10px 18px',
  background: '#FF500A',
  color: '#FFFFFF',
  border: 0,
  borderRadius: '7px',
  cursor: 'pointer',
  fontWeight: 600,
};

const paginationButtonStyle = {
  padding: '8px 13px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#ffffff',
  color: '#152840',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '13px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

const tableCellStyle = {
  padding: '13px 12px',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap' as const,
};
