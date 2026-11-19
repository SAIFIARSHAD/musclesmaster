
import type { RegistrationForm } from './RegistrationFormTypes';

interface FitnessDetailsStepProps {
  form: RegistrationForm;
  updateField: (field: keyof RegistrationForm, value: string) => void;
}

export default function FitnessDetailsStep({
  form,
  updateField,
}: FitnessDetailsStepProps) {
  const height = Number(form.height);
  const weight = Number(form.weight);

  const bmi =
    height > 0 && weight > 0
      ? (weight / ((height / 100) * (height / 100))).toFixed(1)
      : null;

  const bmiValue = bmi ? Number(bmi) : 0;

  const bmiCategory =
    !bmi
      ? ''
      : bmiValue < 18.5
        ? 'Underweight'
        : bmiValue < 25
          ? 'Normal'
          : bmiValue < 30
            ? 'Overweight'
            : 'Obese';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Fitness Details
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add body measurements and fitness preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Height (cm)
          </label>
          <input
            type="number"
            min="1"
            value={form.height}
            onChange={(e) => updateField('height', e.target.value)}
            placeholder="e.g. 175"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Weight (kg)
          </label>
          <input
            type="number"
            min="1"
            value={form.weight}
            onChange={(e) => updateField('weight', e.target.value)}
            placeholder="e.g. 72"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {bmi && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-sm font-medium text-slate-600">
            Body Mass Index (BMI)
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-900">{bmi}</span>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-orange-700">
              {bmiCategory}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            BMI is an estimate based on the entered height and weight.
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Fitness Goal
        </label>
        <select
          value={form.fitnessGoal}
          onChange={(e) => updateField('fitnessGoal', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Select fitness goal</option>
          <option value="WEIGHT_LOSS">Weight Loss</option>
          <option value="MUSCLE_GAIN">Muscle Gain</option>
          <option value="GENERAL_FITNESS">General Fitness</option>
          <option value="STRENGTH">Strength Training</option>
          <option value="FLEXIBILITY">Flexibility</option>
          <option value="ENDURANCE">Endurance</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Medical Conditions / Allergies
        </label>
        <textarea
          rows={4}
          value={form.medicalConditions}
          onChange={(e) => updateField('medicalConditions', e.target.value)}
          placeholder="Mention any medical conditions, injuries or allergies. Enter comma-separated values."
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
        <p className="mt-2 text-xs text-slate-400">
          Leave blank if there are no known conditions.
        </p>
      </div>
    </div>
  );
}
