
import type { RegistrationForm } from './RegistrationFormTypes';
import type { MembershipPlan } from '../../../api/membershipPlans.api';
import type { Trainer } from '../../../api/trainers.api';
import { Pencil } from 'lucide-react';

interface ReviewDetailsStepProps {
  form: RegistrationForm;
  plans: MembershipPlan[];
  trainers: Trainer[];
  selectedPlanId: string;
  selectedTrainerId: string;
  onEdit: (step: number) => void;
}

export default function ReviewDetailsStep({
  form,
  plans,
  trainers,
  selectedPlanId,
  selectedTrainerId,
  onEdit,
}: ReviewDetailsStepProps) {
  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId);
  const selectedTrainer = trainers.find(
    (trainer) => trainer._id === selectedTrainerId,
  );

  const Detail = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || 'Not provided'}
      </p>
    </div>
  );

  const Section = ({
    title,
    step,
    children,
  }: {
    title: string;
    step: number;
    children: React.ReactNode;
  }) => (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>
      {children}
    </section>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Review Registration
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Please verify all details before registering the member.
        </p>
      </div>

      <Section title="Personal Information" step={1}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Detail label="First Name" value={form.firstName} />
          <Detail label="Last Name" value={form.lastName} />
          <Detail label="Date of Birth" value={form.dob} />
          <Detail label="Gender" value={form.gender} />
        </div>
      </Section>

      <Section title="Contact & Account Information" step={1}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Detail label="Mobile Number" value={form.mobile} />
          <Detail label="Email Address" value={form.email} />
          <Detail label="Address" value={form.address} />
          <Detail
            label="Account Password"
            value={form.password ? 'Password set' : 'Not set'}
          />
        </div>
      </Section>

      <Section title="Fitness Profile" step={2}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Detail
            label="Height"
            value={form.height ? `${form.height} cm` : ''}
          />
          <Detail
            label="Weight"
            value={form.weight ? `${form.weight} kg` : ''}
          />
          <Detail label="Fitness Goal" value={form.fitnessGoal} />
          <Detail
            label="Medical Conditions / Allergies"
            value={form.medicalConditions}
          />
        </div>
      </Section>

      <Section title="Membership Details" step={3}>
        {selectedPlan ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Detail label="Plan Name" value={selectedPlan.planName} />
            <Detail label="Plan Type" value={selectedPlan.planType} />
            <Detail
              label="Duration"
              value={`${selectedPlan.duration} days`}
            />
            <Detail
              label="Plan Amount"
              value={`₹${selectedPlan.price.toLocaleString('en-IN')}`}
            />
            <Detail
              label="Personal Training"
              value={selectedPlan.ptIncluded ? 'Included' : 'Not Included'}
            />
          </div>
        ) : (
          <p className="text-sm text-red-500">No membership plan selected.</p>
        )}
      </Section>

      <Section title="Trainer Details" step={3}>
        {selectedTrainer ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Detail label="Trainer Name" value={selectedTrainer.name} />
            <Detail label="Trainer Email" value={selectedTrainer.email} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No personal trainer assigned.
          </p>
        )}
      </Section>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          Before you register
        </p>
        <p className="mt-1 text-sm text-blue-700">
          Please make sure the member's information and selected membership
          plan are correct. The membership will initially remain pending
          payment confirmation.
        </p>
      </div>
    </div>
  );
}
