import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Dumbbell,
  Activity,
} from 'lucide-react';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dob: string;
  gender: Gender;
  address: string;
  height: string;
  weight: string;
  fitnessGoal: string;
  medicalConditions: string;
}

const initialForm: RegistrationForm = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  dob: '',
  gender: 'MALE',
  address: '',
  height: '',
  weight: '',
  fitnessGoal: '',
  medicalConditions: '',
};

const steps = [
  'Personal Details',
  'Fitness Details',
  'Membership',
  'Confirmation',
];

export default function MemberRegistrationPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const bmi = useMemo(() => {
    const height = Number(form.height);
    const weight = Number(form.weight);

    if (!height || !weight || height <= 0 || weight <= 0) {
      return null;
    }

    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }, [form.height, form.weight]);

  const bmiCategory = useMemo(() => {
    if (bmi === null) return '';

    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }, [bmi]);

  const updateField = (field: keyof RegistrationForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError('');
  };

  const validatePersonalDetails = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return 'Please enter first name and last name.';
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!form.dob || form.dob > today) {
      return 'Please select a valid date of birth.';
    }

    return '';
  };

  const validateFitnessDetails = () => {
    if (form.height.trim()) {
      const height = Number(form.height);

      if (!Number.isFinite(height) || height <= 0 || height > 300) {
        return 'Please enter a valid height in centimetres.';
      }
    }

    if (form.weight.trim()) {
      const weight = Number(form.weight);

      if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
        return 'Please enter a valid weight in kilograms.';
      }
    }

    if (form.height.trim() && !form.weight.trim()) {
      return 'Please enter weight to calculate BMI, or clear the height field.';
    }

    if (form.weight.trim() && !form.height.trim()) {
      return 'Please enter height to calculate BMI, or clear the weight field.';
    }

    return '';
  };

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (currentStep === 1) {
      const validationError = validatePersonalDetails();

      if (validationError) {
        setError(validationError);
        return;
      }

      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validationError = validateFitnessDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(
      'Fitness details validated. Membership selection will be added in Day 3.',
    );
  };

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-50';

  const labelClass = 'text-sm font-semibold text-slate-700';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Heading */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#F4510B]"
        >
          <ArrowLeft size={16} />
          Back to Members
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#14243B]">
              Register New Member
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete the member registration details.
            </p>
          </div>

          <span className="rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-[#F4510B]">
            Step {currentStep} of 4
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Registration progress
            </p>
            <h2 className="mt-1 font-bold text-[#14243B]">
              {steps[currentStep - 1]}
            </h2>
          </div>

          <span className="text-sm font-bold text-[#F4510B]">
            {currentStep * 25}% Complete
          </span>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#F4510B] transition-all"
            style={{ width: `${currentStep * 25}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive || isCompleted
                      ? 'bg-[#F4510B] text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : stepNumber}
                </div>

                <span
                  className={`text-xs font-semibold sm:text-sm ${
                    isActive ? 'text-[#14243B]' : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleContinue}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Personal Details */}
        {currentStep === 1 && (
          <>
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                  <User size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-[#14243B]">
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter the member's basic personal details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-7 px-5 py-6 sm:px-7">
              <section>
                <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                  Basic Details
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Gender *</label>
                    <select
                      required
                      value={form.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className={inputClass}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Date of Birth *</label>
                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        required
                        max={today}
                        value={form.dob}
                        onChange={(e) => updateField('dob', e.target.value)}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-100" />

              <section>
                <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Mobile Number *</label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={form.mobile}
                        onChange={(e) =>
                          updateField(
                            'mobile',
                            e.target.value.replace(/\D/g, '').slice(0, 10),
                          )
                        }
                        placeholder="10-digit mobile number"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="member@example.com"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Residential Address</label>
                    <div className="relative">
                      <MapPin
                        size={17}
                        className="absolute left-4 top-5 text-slate-400"
                      />
                      <textarea
                        rows={3}
                        value={form.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Enter complete residential address"
                        className={`${inputClass} resize-y pl-11`}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* Fitness Details */}
        {currentStep === 2 && (
          <>
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                  <Dumbbell size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-[#14243B]">
                    Fitness Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Record the member's fitness profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-7 px-5 py-6 sm:px-7">
              <section>
                <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                  Body Measurements
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      step="0.1"
                      value={form.height}
                      onChange={(e) => updateField('height', e.target.value)}
                      placeholder="e.g. 175"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="0.1"
                      value={form.weight}
                      onChange={(e) => updateField('weight', e.target.value)}
                      placeholder="e.g. 70"
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              {/* BMI Preview */}
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#F4510B]" />
                  <h3 className="text-sm font-bold text-[#14243B]">
                    BMI Overview
                  </h3>
                </div>

                {bmi !== null ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Calculated BMI
                      </p>
                      <p className="mt-1 text-3xl font-bold text-[#14243B]">
                        {bmi}
                      </p>
                    </div>

                    <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-[#F4510B]">
                      {bmiCategory}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Enter height and weight to calculate BMI automatically.
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  BMI is an indicative measurement, not a medical diagnosis.
                </p>
              </section>

              <div className="border-t border-slate-100" />

              <section>
                <h3 className="mb-4 text-sm font-bold text-[#14243B]">
                  Fitness Goals
                </h3>

                <label className={labelClass}>Primary Fitness Goal</label>
                <select
                  value={form.fitnessGoal}
                  onChange={(e) => updateField('fitnessGoal', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select fitness goal</option>
                  <option value="WEIGHT_LOSS">Weight Loss</option>
                  <option value="MUSCLE_GAIN">Muscle Gain</option>
                  <option value="GENERAL_FITNESS">General Fitness</option>
                  <option value="STRENGTH">Strength Training</option>
                  <option value="FLEXIBILITY">Flexibility</option>
                  <option value="ENDURANCE">Endurance</option>
                  <option value="OTHER">Other</option>
                </select>
              </section>

              <div className="border-t border-slate-100" />

              <section>
                <h3 className="mb-2 text-sm font-bold text-[#14243B]">
                  Medical Conditions
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </h3>

                <p className="mb-3 text-xs text-slate-500">
                  Record any conditions or health information voluntarily
                  disclosed by the member.
                </p>

                <textarea
                  rows={4}
                  value={form.medicalConditions}
                  onChange={(e) =>
                    updateField('medicalConditions', e.target.value)
                  }
                  placeholder="Separate multiple conditions with commas"
                  className={`${inputClass} resize-y`}
                />
              </section>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1) {
                navigate('/members');
              } else {
                setCurrentStep(1);
                setError('');
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508]"
          >
            {currentStep === 1 ? 'Continue to Fitness Details' : 'Validate Fitness Details'}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
