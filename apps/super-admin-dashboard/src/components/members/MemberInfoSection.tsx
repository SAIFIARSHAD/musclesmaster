import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
interface MemberInfoItem {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}
interface MemberInfoSectionProps {
  title: string;
  icon: LucideIcon;
  items: MemberInfoItem[];
  columns?: 1 | 2 | 3;
}

export default function MemberInfoSection({
  title,
  icon: SectionIcon,
  items,
  columns = 2,
}: MemberInfoSectionProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
          <SectionIcon size={20} />
        </div>

        <h3 className="text-base font-bold text-[#14243B] sm:text-lg">
          {title}
        </h3>
      </div>

      <div className={`grid ${gridColumns[columns]} gap-x-6 gap-y-5`}>
        {items.map((item, index) => {
          const ItemIcon = item.icon;

          return (
            <div key={`${item.label}-${index}`} className="min-w-0">
              <p className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-500">
                {ItemIcon && <ItemIcon size={14} />}
                {item.label}
              </p>

              <div className="break-words text-sm font-semibold text-slate-800">
                {item.value ?? '—'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}