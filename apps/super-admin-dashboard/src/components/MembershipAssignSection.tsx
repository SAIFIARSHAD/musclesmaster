
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  UserRound,
  CreditCard,
  CalendarDays,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

import { getMembersApi } from '../api/member.api';
import {
  getMembershipPlansApi,
  type MembershipPlan,
} from '../api/membershipPlan.api';
import { assignMembershipApi } from '../api/membership.api';
import { getBranchesApi, type Branch } from '../api/branch.api';
import { useAuth } from '../context/AuthContext';

interface MemberOption {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  memberId?: string;
}

const getMemberName = (member: MemberOption) => {
  const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();

  return fullName || member.name || member.memberId || 'Unnamed Member';
};

const getPlanList = (response: any): MembershipPlan[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.plans)) return response.plans;
  if (Array.isArray(response?.data?.plans)) return response.data.plans;
  return [];
};

export default function MembershipAssignSection() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isBranchStaff =
    user?.role === 'BRANCH_ADMIN' || user?.role === 'RECEPTION';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [notes, setNotes] = useState('');

  const [branchesLoading, setBranchesLoading] = useState(isSuperAdmin);
  const [membersLoading, setMembersLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load plans and, for Super Admin, active branches.
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setPlansLoading(true);
      setError('');

      try {
        const planResponse = await getMembershipPlansApi();

        if (!cancelled) {
          setPlans(getPlanList(planResponse));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Unable to load membership plans.'
          );
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }

      if (isSuperAdmin) {
        setBranchesLoading(true);

        try {
          const branchResponse = await getBranchesApi();

          if (!cancelled) {
            const activeBranches = (branchResponse || []).filter(
              (branch: Branch) => branch.isActive
            );

            setBranches(activeBranches);
          }
        } catch (err: any) {
          if (!cancelled) {
            setError(
              err?.response?.data?.message ||
                err?.message ||
                'Unable to load branches.'
            );
          }
        } finally {
          if (!cancelled) setBranchesLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  // Super Admin selects a branch. Branch staff use their assigned branch.
  const effectiveBranchId = isSuperAdmin
    ? selectedBranchId
    : isBranchStaff
      ? user?.branchId || ''
      : '';

  // Load members only after an effective branch is available.
  useEffect(() => {
    let cancelled = false;

    setMembers([]);
    setMemberId('');

    if (!effectiveBranchId) {
      setMembersLoading(false);
      return;
    }

    const loadMembers = async () => {
      setMembersLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await getMembersApi({
          page: 1,
          limit: 100,
          branchId: effectiveBranchId,
        });

        if (!cancelled) {
          setMembers(response.members || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Unable to load members for this branch.'
          );
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [effectiveBranchId]);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === 'ACTIVE'),
    [plans]
  );

  const selectedPlan = activePlans.find((plan) => plan._id === planId);

  const selectedBranch = branches.find(
    (branch) => branch._id === selectedBranchId
  );

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setMemberId('');
    setPlanId('');
    setError('');
    setSuccess('');
    setMembers([]);
  };

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!effectiveBranchId) {
      setError('Please select a branch first.');
      return;
    }

    if (!memberId || !planId || !startDate) {
      setError('Please select a member, plan and start date.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await assignMembershipApi({
        memberId,
        planId,
        startDate,
        notes: notes.trim(),
      });

      setSuccess(
        response?.message ||
          'Membership assigned successfully. It is now pending payment confirmation.'
      );

      setMemberId('');
      setPlanId('');
      setStartDate(new Date().toLocaleDateString('en-CA'));
      setNotes('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to assign membership. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const initialLoading =
    plansLoading || (isSuperAdmin && branchesLoading);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-3 text-[#F4510B]">
            <CreditCard size={22} />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-[#14243B]">
              Assign Membership
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign an active membership plan to an existing member.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {initialLoading ? (
          <div className="flex min-h-45 items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-[#F4510B]"
            />
            <span className="ml-3 text-sm text-slate-500">
              Loading branches and plans...
            </span>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-5">
            {/* Branch Selection: Super Admin only */}
            {isSuperAdmin && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 size={16} className="text-[#F4510B]" />
                  Select Branch <span className="text-red-500">*</span>
                </label>

                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Choose a branch first</option>

                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>

                {branches.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No active branches found.
                  </p>
                )}
              </div>
            )}

            {/* Assigned Branch: Branch Admin and Reception */}
            {isBranchStaff && (
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#14243B]">
                  <Building2 size={17} className="text-[#F4510B]" />
                  Assigned Branch
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Your account's assigned branch will be used automatically.
                </p>
              </div>
            )}

            {!isSuperAdmin && !isBranchStaff && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                You are not authorized to assign memberships.
              </div>
            )}

            {/* Member Selection */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UserRound size={16} className="text-[#F4510B]" />
                Select Member <span className="text-red-500">*</span>
              </label>

              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                disabled={!effectiveBranchId || membersLoading || !members.length}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {!effectiveBranchId
                    ? 'Select a branch first'
                    : membersLoading
                      ? 'Loading members...'
                      : 'Choose a member'}
                </option>

                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {getMemberName(member)}
                    {member.memberId ? ` (${member.memberId})` : ''}
                    {member.phone ? ` - ${member.phone}` : ''}
                  </option>
                ))}
              </select>

              {membersLoading && (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin" />
                  Loading branch members...
                </p>
              )}

              {effectiveBranchId && !membersLoading && members.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No members found in this branch. Please register a member first.
                </p>
              )}
            </div>

            {/* Plan Selection */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CreditCard size={16} className="text-[#F4510B]" />
                Select Membership Plan <span className="text-red-500">*</span>
              </label>

              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                disabled={!activePlans.length}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">Choose a membership plan</option>

                {activePlans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.planName} — ₹{plan.price} ({plan.duration} days)
                  </option>
                ))}
              </select>

              {activePlans.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No active plans available. Create or activate a plan first.
                </p>
              )}
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#F4510B]">
                  Selected Plan Summary
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="mt-1 text-sm font-bold text-[#14243B]">
                      {selectedPlan.planName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="mt-1 text-sm font-bold text-[#14243B]">
                      ₹{selectedPlan.price}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="mt-1 text-sm font-bold text-[#14243B]">
                      {selectedPlan.duration} Days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={16} className="text-[#F4510B]" />
                Membership Start Date <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText size={16} className="text-[#F4510B]" />
                Notes
              </label>

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information..."
                maxLength={500}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                {success}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !effectiveBranchId ||
                  membersLoading ||
                  !members.length ||
                  !activePlans.length ||
                  (!isSuperAdmin && !isBranchStaff)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CreditCard size={17} />
                    Assign Membership
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
