
import { useState } from 'react';
import { usePaymentModule } from '../hooks/usePaymentModule';
import type {
  MemberLookupItem,
  PendingMembershipLookupItem,
} from '../types/collection.types';
import type {
  MembershipPaymentSummary,
  PaymentMethod,
} from '../types/payment.types';

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E2E7EF',
  borderRadius: '12px',
  padding: '22px',
  boxShadow: '0 2px 8px rgba(21, 40, 64, 0.04)',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '11px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '7px',
  background: '#FFFFFF',
  color: '#152840',
  fontSize: '14px',
  marginTop: '7px',
};

const primaryButtonStyle = {
  padding: '11px 20px',
  background: '#FF500A',
  color: '#FFFFFF',
  border: 0,
  borderRadius: '7px',
  cursor: 'pointer',
  fontWeight: 600,
};

const mutedStyle = {
  color: '#718096',
  fontSize: '13px',
};

export const PaymentCollectionForm = () => {
  const { collectionLookup, payments, invoices } = usePaymentModule();

  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<MemberLookupItem[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<MemberLookupItem | null>(null);

  const [memberships, setMemberships] =
    useState<PendingMembershipLookupItem[]>([]);
  const [selectedMembership, setSelectedMembership] =
    useState<PendingMembershipLookupItem | null>(null);

  const [summary, setSummary] =
    useState<MembershipPaymentSummary | null>(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const [searching, setSearching] = useState(false);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invoice states
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleSearch = async () => {
    if (!search.trim()) {
      setError('Please enter member name, mobile or Member ID.');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSuccess('');

      setSelectedMember(null);
      setMemberships([]);
      setSelectedMembership(null);
      setSummary(null);

      // Clear previously generated invoice
      setInvoiceId(null);
      setInvoiceError('');

      const response = await collectionLookup.searchMembers({
        search: search.trim(),
        page: 1,
        limit: 10,
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to search members.');
      }

      setMembers(response.data || []);

      if (!response.data?.length) {
        setError('No members found.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Member search failed.',
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMember = async (member: MemberLookupItem) => {
    try {
      setSelectedMember(member);
      setMemberships([]);
      setSelectedMembership(null);
      setSummary(null);
      setAmount('');
      setSuccess('');
      setError('');

      // Clear previous invoice when changing member
      setInvoiceId(null);
      setInvoiceError('');

      setLoadingMemberships(true);

      const response = await collectionLookup.getPendingMemberships({
        memberId: member._id,
        status: 'PENDING',
        page: 1,
        limit: 20,
      });

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to load pending memberships.',
        );
      }

      setMemberships(response.data || []);

      if (!response.data?.length) {
        setError('This member has no pending membership.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load memberships.',
      );
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleSelectMembership = async (
    membership: PendingMembershipLookupItem,
  ) => {
    try {
      setSelectedMembership(membership);
      setSummary(null);
      setAmount('');
      setSuccess('');
      setError('');

      // Clear previous invoice when changing membership
      setInvoiceId(null);
      setInvoiceError('');

      setLoadingSummary(true);

      const response = await payments.getMembershipPaymentSummary(
        membership._id,
      );

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to load payment summary.',
        );
      }

      setSummary(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payment summary.',
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  // Download generated invoice PDF
  const handleDownloadInvoice = async () => {
    if (!invoiceId) {
      setInvoiceError('Invoice is not available.');
      return;
    }

    try {
      setDownloadingInvoice(true);
      setInvoiceError('');

      const blob = await invoices.downloadInvoicePdf(invoiceId);

      const pdfBlob = new Blob([blob], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `Invoice-${invoiceId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setInvoiceError(
        err instanceof Error
          ? err.message
          : 'Unable to download invoice.',
      );
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleCollectPayment = async () => {
    if (!selectedMembership || !summary) {
      setError('Please select a membership first.');
      return;
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (paymentAmount > summary.remainingDue) {
      setError(
        `Payment cannot exceed remaining due of ${currency(summary.remainingDue)}.`,
      );
      return;
    }

    if (
      paymentMethod !== 'CASH' &&
      !transactionId.trim()
    ) {
      setError('Please enter the transaction ID for this payment method.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Clear old invoice before a new collection attempt
      setInvoiceId(null);
      setInvoiceError('');

      const response = await payments.collectMembershipPayment({
        membershipId: selectedMembership._id,
        amount: paymentAmount,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey: `${selectedMembership._id}-${Date.now()}`,
      });

      if (!response.success) {
        throw new Error(response.message || 'Payment collection failed.');
      }

      const result = response.data;

      // Capture invoice ID returned by backend
      setInvoiceId(result.invoice?._id ?? null);

      setSuccess(
        result.membershipActivated
          ? 'Payment collected successfully. Membership is now ACTIVE.'
          : `Payment collected successfully. Remaining due: ${currency(result.remainingDue)}.`,
      );

      setAmount('');
      setTransactionId('');
      setNotes('');

      const updatedSummary =
        await payments.getMembershipPaymentSummary(
          selectedMembership._id,
        );

      if (updatedSummary.success) {
        setSummary(updatedSummary.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to collect payment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        width: '100%',
        color: '#152840',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
          Collect Payment
        </h2>
        <p style={{ ...mutedStyle, marginTop: '6px' }}>
          Search member, select pending membership and collect payment.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 15px',
            borderRadius: '8px',
            background: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: '12px 15px',
            borderRadius: '8px',
            background: '#ECFDF5',
            color: '#047857',
            fontSize: '14px',
          }}
        >
          {success}
        </div>
      )}

      {/* Invoice Download */}
      {invoiceId && (
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            border: '1px solid #A7F3D0',
            background: '#F0FDF4',
          }}
        >
          <div>
            <strong style={{ color: '#047857', fontSize: '15px' }}>
              Payment Invoice Generated
            </strong>

            <p style={{ ...mutedStyle, marginBottom: 0 }}>
              Your payment receipt is ready to download.
            </p>

            {invoiceError && (
              <p
                role="alert"
                style={{
                  color: '#B91C1C',
                  fontSize: '13px',
                  marginBottom: 0,
                }}
              >
                {invoiceError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleDownloadInvoice()}
            disabled={downloadingInvoice}
            style={{
              ...primaryButtonStyle,
              background: '#047857',
              opacity: downloadingInvoice ? 0.7 : 1,
              cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
            }}
          >
            {downloadingInvoice ? 'Downloading...' : 'Download Invoice PDF'}
          </button>
        </div>
      )}

      <section style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
          1. Search Member
        </h3>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSearch();
            }}
            placeholder="Enter member name, mobile or Member ID"
            style={{ ...inputStyle, flex: '1 1 260px', marginTop: 0 }}
          />

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching}
            style={primaryButtonStyle}
          >
            {searching ? 'Searching...' : 'Search Member'}
          </button>
        </div>

        {members.length > 0 && (
          <div style={{ marginTop: '18px', display: 'grid', gap: '10px' }}>
            {members.map((member) => {
              const isSelected = selectedMember?._id === member._id;

              return (
                <button
                  type="button"
                  key={member._id}
                  onClick={() => void handleSelectMember(member)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #FF500A'
                      : '1px solid #E2E7EF',
                    background: isSelected ? '#FFF7F3' : '#FFFFFF',
                    cursor: 'pointer',
                    color: '#152840',
                  }}
                >
                  <strong>
                    {member.firstName} {member.lastName}
                  </strong>
                  <div style={{ ...mutedStyle, marginTop: '5px' }}>
                    ID: {member.memberId} · Mobile: {member.mobile}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedMember && (
        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>
            2. Select Pending Membership
          </h3>

          <div style={{ ...mutedStyle, marginBottom: '14px' }}>
            Selected member:{' '}
            <strong style={{ color: '#152840' }}>
              {selectedMember.firstName} {selectedMember.lastName}
            </strong>
          </div>

          {loadingMemberships ? (
            <p style={mutedStyle}>Loading memberships...</p>
          ) : memberships.length === 0 ? (
            <p style={mutedStyle}>No pending memberships available.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {memberships.map((membership) => (
                <button
                  type="button"
                  key={membership._id}
                  onClick={() => void handleSelectMembership(membership)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '8px',
                    border:
                      selectedMembership?._id === membership._id
                        ? '1px solid #FF500A'
                        : '1px solid #E2E7EF',
                    background:
                      selectedMembership?._id === membership._id
                        ? '#FFF7F3'
                        : '#FFFFFF',
                    cursor: 'pointer',
                    color: '#152840',
                  }}
                >
                  <strong>
                    {membership.planId?.planName || 'Membership Plan'}
                  </strong>
                  <div style={{ ...mutedStyle, marginTop: '5px' }}>
                    Agreed amount: {currency(membership.agreedAmount)}
                    {' · '}
                    Branch: {membership.branchId?.name || '—'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedMembership && (
        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
            3. Membership Payment Summary
          </h3>

          {loadingSummary ? (
            <p style={mutedStyle}>Loading payment summary...</p>
          ) : summary ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  { label: 'Agreed Amount', value: summary.agreedAmount },
                  { label: 'Already Collected', value: summary.totalCollected },
                  { label: 'Total Refunded', value: summary.totalRefunded },
                  { label: 'Remaining Due', value: summary.remainingDue },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '15px',
                      borderRadius: '8px',
                      background: '#F4F6FA',
                    }}
                  >
                    <div style={mutedStyle}>{item.label}</div>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '18px',
                      }}
                    >
                      {currency(item.value)}
                    </strong>
                  </div>
                ))}
              </div>

              {summary.remainingDue <= 0 ? (
                <p style={{ color: '#047857', marginTop: '18px' }}>
                  No outstanding amount for this membership.
                </p>
              ) : (
                <div style={{ marginTop: '22px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
                    4. Payment Details
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <label style={mutedStyle}>
                      Amount to collect
                      <input
                        type="number"
                        min="0.01"
                        max={summary.remainingDue}
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="Enter amount"
                        style={inputStyle}
                      />
                    </label>

                    <label style={mutedStyle}>
                      Payment method
                      <select
                        value={paymentMethod}
                        onChange={(event) =>
                          setPaymentMethod(event.target.value as PaymentMethod)
                        }
                        style={inputStyle}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                      </select>
                    </label>

                    {paymentMethod !== 'CASH' && (
                      <label style={mutedStyle}>
                        Transaction ID
                        <input
                          value={transactionId}
                          onChange={(event) => setTransactionId(event.target.value)}
                          placeholder="Enter transaction reference"
                          style={inputStyle}
                        />
                      </label>
                    )}

                    <label style={mutedStyle}>
                      Notes (optional)
                      <input
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Add payment notes"
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '22px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#718096' }}>
                      Outstanding:{' '}
                      <strong style={{ color: '#152840' }}>
                        {currency(summary.remainingDue)}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => void handleCollectPayment()}
                      disabled={submitting || loadingSummary}
                      style={{
                        ...primaryButtonStyle,
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? 'Processing...' : 'Collect Payment'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={mutedStyle}>Payment summary is not available.</p>
          )}
        </section>
      )}
    </div>
  );
};
