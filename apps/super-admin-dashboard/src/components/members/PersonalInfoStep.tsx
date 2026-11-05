
import type {
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';

import type { MemberFormInput } from '../../validators/member.schema';

interface PersonalInfoStepProps {
  register: UseFormRegister<MemberFormInput>;
  errors: FieldErrors<MemberFormInput>;
}

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#14243B] outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-2 focus:ring-orange-100';

const labelClass =
  'text-sm font-semibold text-[#14243B]';

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-[#F4510B]">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PersonalInfoStep({
  register,
  errors,
}: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#14243B]">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the member's basic personal details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* First Name */}
        <FormField
          label="First Name"
          required
          error={errors.firstName?.message}
        >
          <input
            type="text"
            placeholder="Enter first name"
            autoComplete="given-name"
            className={inputClass}
            {...register('firstName')}
          />
        </FormField>

        {/* Last Name */}
        <FormField
          label="Last Name"
          required
          error={errors.lastName?.message}
        >
          <input
            type="text"
            placeholder="Enter last name"
            autoComplete="family-name"
            className={inputClass}
            {...register('lastName')}
          />
        </FormField>

        {/* Gender */}
        <FormField
          label="Gender"
          required
          error={errors.gender?.message}
        >
          <select
            className={inputClass}
            defaultValue=""
            {...register('gender')}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </FormField>

        {/* Date of Birth */}
        <FormField
          label="Date of Birth"
          required
          error={errors.dob?.message}
        >
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            className={inputClass}
            {...register('dob')}
          />
        </FormField>

        {/* Mobile */}
        <FormField
          label="Mobile Number"
          required
          error={errors.mobile?.message}
        >
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            autoComplete="tel-national"
            className={inputClass}
            {...register('mobile')}
          />
        </FormField>

        {/* Email */}
        <FormField
          label="Email Address"
          required
          error={errors.email?.message}
        >
          <input
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            className={inputClass}
            {...register('email')}
          />
        </FormField>
      </div>

      {/* Address */}
      <FormField
        label="Residential Address"
        error={errors.address?.message}
      >
        <textarea
          rows={3}
          placeholder="Enter complete residential address"
          autoComplete="street-address"
          className={`${inputClass} resize-none`}
          {...register('address')}
        />
      </FormField>

      <p className="text-xs text-slate-400">
        Fields marked with <span className="font-bold text-[#F4510B]">*</span> are mandatory.
      </p>
    </div>
  );
}
