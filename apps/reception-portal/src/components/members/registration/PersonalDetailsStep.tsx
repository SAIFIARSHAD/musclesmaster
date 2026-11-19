
import type { RegistrationForm } from './RegistrationFormTypes';

interface PersonalDetailsStepProps {
  form: RegistrationForm;
  updateField: (field: keyof RegistrationForm, value: string) => void;
}

export default function PersonalDetailsStep({
  form,
  updateField,
}: PersonalDetailsStepProps) {
  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the member's basic personal details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            First Name *
          </label>
          <input
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="Enter first name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Last Name *
          </label>
          <input
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Enter last name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Mobile Number *
          </label>
          <input
            type="tel"
            maxLength={10}
            value={form.mobile}
            onChange={(e) =>
              updateField('mobile', e.target.value.replace(/\D/g, ''))
            }
            placeholder="10-digit mobile number"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email Address *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="member@example.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date of Birth *
          </label>
          <input
            type="date"
            max={today}
            value={form.dob}
            onChange={(e) => updateField('dob', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Gender *
          </label>
          <select
            value={form.gender}
            onChange={(e) => updateField('gender', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Address
          </label>
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Enter complete address"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Confirm Password *
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>
    </div>
  );
}
