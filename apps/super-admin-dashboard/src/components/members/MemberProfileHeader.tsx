import { ArrowLeft, CalendarDays, Edit, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MemberDetails } from '../../api/member.api';

interface MemberProfileHeaderProps {
  member: MemberDetails;
}

export default function MemberProfileHeader({
  member,
}: MemberProfileHeaderProps) {
  const navigate = useNavigate();

  const fullName = `${member.firstName} ${member.lastName}`;

  const isActive = member.status === 'ACTIVE';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#14243B] sm:text-2xl">
            Member Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View member information and account details
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/members/${member._id}/edit`)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D94308]"
        >
          <Edit size={16} />
          Edit Profile
        </button>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#14243B] text-white">
            <UserRound size={27} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              {fullName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {member.memberId} <span className="mx-1">·</span>{' '}
              {member.gender}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
              isActive
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span
              className={`mr-2 h-2 w-2 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-amber-500'
              }`}
            />
            {member.status}
          </span>

          {member.createdAt && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={15} />
              Registered{' '}
              {new Date(member.createdAt).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}