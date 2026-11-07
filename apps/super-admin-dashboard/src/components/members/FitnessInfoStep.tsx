import { useMemo } from 'react';
import {
  Activity,
  HeartPulse,
  Scale,
  Ruler,
} from 'lucide-react';

import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form';

import type { MemberFormInput } from '../../validators/member.schema';
interface FitnessInfoStepProps {
  register: UseFormRegister<MemberFormInput>;
  watch: UseFormWatch<MemberFormInput>;
  errors: FieldErrors<MemberFormInput>;
}

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#14243B] outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-2 focus:ring-orange-100';

const fitnessGoals = [
  'Weight Loss',
  'Muscle Building',
  'Strength Training',
  'General Fitness',
  'Weight Gain',
  'Endurance Training',
  'Flexibility',
];

const medicalOptions = [
  'Diabetes',
  'Blood Pressure',
  'Asthma',
  'Heart Condition',
  'Joint Pain',
  'Thyroid',
  'Back Pain',
];

export default function FitnessInfoStep({
  register,
  watch,
  errors,
}: FitnessInfoStepProps) {
  const height = watch('height');
  const weight = watch('weight');

  const bmi = useMemo(() => {
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (
      !heightValue ||
      !weightValue ||
      heightValue <= 0 ||
      weightValue <= 0
    ) {
      return null;
    }

    const heightInMeters = heightValue / 100;
    return Number(
      (weightValue / (heightInMeters * heightInMeters)).toFixed(1),
    );
  }, [height, weight]);

  const bmiCategory = useMemo(() => {
    if (bmi === null) return null;

    if (bmi < 18.5) {
      return {
        label: 'Underweight',
        description: 'Below the standard adult BMI range',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }

    if (bmi < 25) {
      return {
        label: 'Normal range',
        description: 'Within the standard adult BMI range',
        className: 'bg-green-50 text-green-700 border-green-200',
      };
    }

    if (bmi < 30) {
      return {
        label: 'Overweight',
        description: 'Above the standard adult BMI range',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    return {
      label: 'Obesity range',
      description: 'BMI is in the obesity range',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }, [bmi]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#14243B]">
          Fitness Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Record the member's fitness details and health information.
        </p>
      </div>

      {/* Height and Weight */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#14243B]">
            <Ruler size={16} className="text-[#F4510B]" />
            Height (cm)
          </label>

          <input
            type="number"
            min="1"
            max="300"
            step="0.1"
            placeholder="e.g. 175"
            className={inputClass}
            {...register('height', {
              setValueAs: (value) =>
                value === '' ? undefined : Number(value),
            })}
          />

          {errors.height?.message && (
            <p className="mt-1.5 text-xs text-red-500">
              {String(errors.height.message)}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#14243B]">
            <Scale size={16} className="text-[#F4510B]" />
            Weight (kg)
          </label>

          <input
            type="number"
            min="1"
            max="500"
            step="0.1"
            placeholder="e.g. 70"
            className={inputClass}
            {...register('weight', {
              setValueAs: (value) =>
                value === '' ? undefined : Number(value),
            })}
          />

          {errors.weight?.message && (
            <p className="mt-1.5 text-xs text-red-500">
              {String(errors.weight.message)}
            </p>
          )}
        </div>
      </div>

      {/* BMI Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC]">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Activity size={20} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14243B]">
              Body Mass Index (BMI)
            </h3>
            <p className="text-xs text-slate-500">
              Automatically calculated using height and weight
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Calculated BMI
            </p>

            <p className="mt-1 text-3xl font-extrabold text-[#14243B]">
              {bmi !== null ? bmi : '--'}
            </p>
          </div>

          {bmiCategory ? (
            <div className={`rounded-xl border px-4 py-3 ${bmiCategory.className}`}>
              <p className="text-sm font-bold">
                {bmiCategory.label}
              </p>
              <p className="mt-1 text-xs">
                {bmiCategory.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Enter height and weight to calculate BMI.
            </p>
          )}
        </div>
      </div>

      {/* Fitness Goal */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#14243B]">
          <HeartPulse size={16} className="text-[#F4510B]" />
          Fitness Goal
        </label>

        <select
          className={inputClass}
          defaultValue=""
          {...register('fitnessGoal')}
        >
          <option value="">Select fitness goal</option>

          {fitnessGoals.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
      </div>

      {/* Medical Conditions */}
      <div>
        <label className="text-sm font-semibold text-[#14243B]">
          Medical Conditions
        </label>

        <p className="mt-1 text-xs text-slate-500">
          Select all applicable conditions. This field is optional.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {medicalOptions.map((condition) => (
            <label
              key={condition}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-600 transition hover:border-orange-200 hover:bg-orange-50/40"
            >
              <input
                type="checkbox"
                value={condition}
                className="h-4 w-4 accent-[#F4510B]"
                {...register('medicalConditions')}
              />

              {condition}
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Members should disclose relevant health conditions before starting
          their fitness program.
        </p>
      </div>
    </div>
  );
}
