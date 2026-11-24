import { Check } from 'lucide-react';
interface RegistrationProgressProps {
  currentStep: number;
  steps: string[];
}

export default function RegistrationProgress({
  currentStep,
  steps,
}: RegistrationProgressProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Member Registration
          </p>
          <h2 className="mt-1 text-base font-bold text-[#14243B]">
            {steps[currentStep - 1]}
          </h2>
        </div>

        <div className="rounded-xl bg-orange-50 px-3 py-2 text-right">
          <p className="text-lg font-bold leading-none text-[#F4510B]">
            {Math.round((currentStep / steps.length) * 100)}%
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            Completed
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-100" />

        <div
          className="absolute left-0 top-4 h-1 rounded-full bg-[#F4510B] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        <div className="relative grid grid-cols-4">
          {steps.map((step, index) => {
            const number = index + 1;
            const completed = number < currentStep;
            const active = number === currentStep;

            return (
              <div
                key={step}
                className={`flex min-w-0 flex-col items-center ${
                  index === 0
                    ? 'items-start'
                    : index === steps.length - 1
                      ? 'items-end'
                      : 'items-center'
                }`}
              >
                <div
                  className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    completed
                      ? 'border-[#F4510B] bg-[#F4510B] text-white'
                      : active
                        ? 'border-[#F4510B] bg-white text-[#F4510B] ring-4 ring-orange-50'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {completed ? <Check size={15} strokeWidth={3} /> : number}
                </div>

                <p
                  className={`mt-3 max-w-full text-center text-[11px] font-semibold sm:text-xs ${
                    active
                      ? 'text-[#F4510B]'
                      : completed
                        ? 'text-[#14243B]'
                        : 'text-slate-400'
                  }`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
