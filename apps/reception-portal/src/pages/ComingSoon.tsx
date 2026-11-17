
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({
  title,
  description,
}: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
          <Construction size={29} />
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-[#14243B]">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description || 'This module is planned for an upcoming development phase.'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#14243B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#203957]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
