interface MemberStatusBadgeProps {
  status: string;
}

export default function MemberStatusBadge({
  status,
}: MemberStatusBadgeProps) {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-green-50 text-green-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-slate-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
