import {
  UserRound,
  Activity,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Ruler,
  Scale,
} from 'lucide-react';

import type { MemberFormInput } from '../../validators/member.schema';
import type { Branch } from '../../api/branch.api';

interface ReviewMemberStepProps {
  values: MemberFormInput;
  branches: Branch[];
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#F4510B]">
          <Icon size={18} />
        </div>

        <h3 className="text-sm font-bold text-[#14243B]">{title}</h3>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#14243B]">
        {value || 'Not provided'}
      </p>
    </div>
  );
}

export default function ReviewMemberStep({
  values,
  branches,
}: ReviewMemberStepProps) {
  const height = Number(values.height);
  const weight = Number(values.weight);

  const bmi =
    height > 0 && weight > 0
      ? (weight / Math.pow(height / 100, 2)).toFixed(1)
      : 'Not calculated';

  const selectedBranch = branches.find(
    (branch) => branch._id === values.branchId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#14243B]">
          Review Registration
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Verify the member details before creating the account.
        </p>
      </div>

      {/* Personal Information */}
      <ReviewSection title="Personal Information" icon={UserRound}>
        <ReviewItem
          label="Full Name"
          value={`${values.firstName} ${values.lastName}`}
        />

        <ReviewItem label="Gender" value={values.gender} />

        <ReviewItem
          label="Date of Birth"
          value={values.dob}
        />

        <div className="flex items-start gap-2">
          <Phone size={15} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem label="Mobile Number" value={values.mobile} />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Mail size={15} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem label="Email Address" value={values.email} />
          </div>
        </div>

        <div className="flex items-start gap-2 sm:col-span-2">
          <MapPin size={15} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem label="Address" value={values.address} />
          </div>
        </div>
      </ReviewSection>

      {/* Fitness Information */}
      <ReviewSection title="Fitness Information" icon={Activity}>
        <div className="flex items-start gap-2">
          <Ruler size={16} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem
              label="Height"
              value={values.height ? `${values.height} cm` : undefined}
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Scale size={16} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem
              label="Weight"
              value={values.weight ? `${values.weight} kg` : undefined}
            />
          </div>
        </div>

        <ReviewItem label="BMI" value={bmi} />

        <ReviewItem
          label="Fitness Goal"
          value={values.fitnessGoal}
        />

        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-slate-400">
            Medical Conditions
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {values.medicalConditions?.length ? (
              values.medicalConditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F4510B]"
                >
                  {condition}
                </span>
              ))
            ) : (
              <span className="text-sm font-medium text-slate-500">
                None provided
              </span>
            )}
          </div>
        </div>
      </ReviewSection>

      {/* Account Information */}
      <ReviewSection title="Account & Assignment" icon={ShieldCheck}>
        <div className="flex items-start gap-2">
          <Building2 size={16} className="mt-0.5 text-slate-400" />
          <div>
            <ReviewItem
              label="Assigned Branch"
              value={
                selectedBranch
                  ? `${selectedBranch.name} (${selectedBranch.code})`
                  : 'Automatically assigned by backend'
              }
            />
          </div>
        </div>

        <ReviewItem
          label="Account Role"
          value="MEMBER"
        />

        <ReviewItem
          label="Initial Password"
          value="Password configured"
        />

        <ReviewItem
          label="Trainer"
          value="Not assigned"
        />
      </ReviewSection>

      {/* Registration Note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <CalendarDays
          size={19}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-bold text-blue-800">
            Registration Status
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            The member account will be created with INACTIVE status.
            Membership selection, payment and activation will be
            integrated with the Membership module.
          </p>
        </div>
      </div>
    </div>
  );
}
