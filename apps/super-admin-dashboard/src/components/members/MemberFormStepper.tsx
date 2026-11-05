
import {
  Check,
  UserRound,
  Activity,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';

interface MemberFormStepperProps {
  currentStep: number;
}

const steps = [
  {
    title: 'Personal',
    description: 'Basic information',
    icon: UserRound,
  },
  {
    title: 'Fitness',
    description: 'Health & fitness',
    icon: Activity,
  },
  {
    title: 'Account',
    description: 'Access & assignment',
    icon: ShieldCheck,
  },
  {
    title: 'Review',
    description: 'Confirm details',
    icon: ClipboardCheck,
  },
];

export default function MemberFormStepper({
  currentStep,
}: MemberFormStepperProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const stepNumber = index + 1;

          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <div
              key={step.title}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Progress connector */}
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-5 h-[2px] w-full -translate-y-1/2 ${
                    currentStep >= stepNumber
                      ? 'bg-[#F4510B]'
                      : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step icon */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'border-[#F4510B] bg-[#F4510B] text-white'
                    : isActive
                      ? 'border-[#F4510B] bg-orange-50 text-[#F4510B]'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check size={19} strokeWidth={2.8} />
                ) : (
                  <Icon size={19} strokeWidth={2} />
                )}
              </div>

              {/* Step details */}
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-bold sm:text-sm ${
                    isActive || isCompleted
                      ? 'text-[#14243B]'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>

                <p className="mt-1 hidden text-[10px] text-slate-400 sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile progress information */}
      <div className="mt-5 border-t border-slate-100 pt-4 sm:hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#14243B]">
            Step {currentStep} of {steps.length}
          </span>

          <span className="text-xs font-bold text-[#F4510B]">
            {Math.round((currentStep / steps.length) * 100)}%
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#F4510B] transition-all duration-300"
            style={{
              width: `${(currentStep / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
