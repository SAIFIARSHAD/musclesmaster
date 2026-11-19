
import { CheckCircle2, ArrowRight, UserRound, CreditCard } from 'lucide-react';

interface RegistrationSuccessProps {
  memberName: string;
  memberId: string;
  membershipStatus?: string;
  onGoToMembers: () => void;
  onRegisterAnother: () => void;
}

export default function RegistrationSuccess({
  memberName,
  memberId,
  membershipStatus = 'PENDING',
  onGoToMembers,
  onRegisterAnother,
}: RegistrationSuccessProps) {
  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 size={44} className="text-green-600" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-slate-900">
          Member Registered Successfully!
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {memberName} has been successfully registered. The member account
          and membership details have been created.
        </p>

        <div className="mt-8 space-y-4 rounded-xl bg-slate-50 p-5 text-left">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2.5">
              <UserRound size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Member Name</p>
              <p className="font-semibold text-slate-800">{memberName}</p>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2.5">
              <CreditCard size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Member ID</p>
              <p className="font-semibold text-slate-800">{memberId}</p>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Membership Status</p>
              <p className="mt-1 text-sm font-semibold text-amber-700">
                {membershipStatus}
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Payment Pending
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onGoToMembers}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Go to Members
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onRegisterAnother}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Register Another Member
          </button>
        </div>
      </div>
    </div>
  );
}
