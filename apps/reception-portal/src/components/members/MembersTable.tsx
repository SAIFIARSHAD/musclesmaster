
import { Users, Phone, Mail, Eye } from 'lucide-react';

import type { Member } from '../../api/members.api';
import MemberStatusBadge from './MemberStatusBadge';

interface MembersTableProps {
  members: Member[];
  loading: boolean;
  onViewProfile: (memberId: string) => void;
}

const formatDate = (date?: string) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '—';

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function MembersTable({
  members,
  loading,
  onViewProfile,
}: MembersTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-[#F4510B]" />
        <p className="text-sm text-slate-500">Loading members...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Users size={28} className="text-slate-400" />
        </div>

        <h3 className="mt-4 font-semibold text-slate-800">
          No members found
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-500">
          No members match your search or selected filters. Try changing
          your filters or register a new member.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Member
            </th>
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Member ID
            </th>
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact
            </th>
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gender
            </th>
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registered
            </th>
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {members.map((member) => {
            const fullName =
              `${member.firstName} ${member.lastName}`.trim();

            return (
              <tr
                key={member._id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-bold text-[#F4510B]">
                      {member.firstName.charAt(0).toUpperCase()}
                      {member.lastName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {member.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                    {member.memberId}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone size={13} className="text-slate-400" />
                      {member.mobile}
                    </p>

                    {member.email && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail size={13} />
                        {member.email}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 text-sm capitalize text-slate-600">
                  {member.gender.toLowerCase()}
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDate(member.createdAt)}
                </td>

                <td className="px-5 py-4">
                  <MemberStatusBadge status={member.status} />
                </td>

                <td className="px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onViewProfile(member._id)}
                    title={`View ${fullName}'s profile`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B]"
                  >
                    <Eye size={14} />
                    View Profile
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
