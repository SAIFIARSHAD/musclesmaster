
import type { MembershipPlan } from '../../../api/membershipPlans.api';
import type { Trainer } from '../../../api/trainers.api';

interface MembershipStepProps {
  plans: MembershipPlan[];
  trainers: Trainer[];
  selectedPlanId: string;
  selectedTrainerId: string;
  onPlanChange: (value: string) => void;
  onTrainerChange: (value: string) => void;
  loadingOptions: boolean;
  optionsError: string;
}

export default function MembershipStep({
  plans,
  trainers,
  selectedPlanId,
  selectedTrainerId,
  onPlanChange,
  onTrainerChange,
  loadingOptions,
  optionsError,
}: MembershipStepProps) {
  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId);
  const selectedTrainer = trainers.find(
    (trainer) => trainer._id === selectedTrainerId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Membership & Trainer
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a membership plan and assign a trainer if required.
        </p>
      </div>

      {loadingOptions && (
        <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
          Loading membership plans and trainers...
        </div>
      )}

      {optionsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {optionsError}
        </div>
      )}

      {!loadingOptions && !optionsError && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Membership Plan *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => onPlanChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select membership plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.planName} — ₹{plan.price.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedPlan.planName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPlan.description || selectedPlan.planType}
                  </p>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  ₹{selectedPlan.price.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-slate-500">Duration</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPlan.duration} days
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-slate-500">Personal Training</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPlan.ptIncluded ? 'Included' : 'Not Included'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Assign Personal Trainer
              {selectedPlan?.ptIncluded && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>

            <select
              value={selectedTrainerId}
              onChange={(e) => onTrainerChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select trainer</option>
              {trainers.map((trainer) => (
                <option key={trainer._id} value={trainer._id}>
                  {trainer.name}
                </option>
              ))}
            </select>

            {selectedPlan?.ptIncluded && !selectedTrainerId && (
              <p className="mt-2 text-xs text-red-600">
                This plan includes personal training. Please assign a trainer.
              </p>
            )}
          </div>

          {selectedTrainer && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Assigned Trainer
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedTrainer.name}
              </p>
              <p className="text-xs text-slate-400">
                {selectedTrainer.email}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
