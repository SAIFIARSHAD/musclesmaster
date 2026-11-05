
import { useState } from 'react';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Building2,
  ShieldCheck,
  Info,
} from 'lucide-react';

import type {
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';

import type { MemberFormInput } from '../../validators/member.schema';
import type { Branch } from '../../api/branch.api';

interface AccountInfoStepProps {
  register: UseFormRegister<MemberFormInput>;
  errors: FieldErrors<MemberFormInput>;
  branches: Branch[];
  isSuperAdmin: boolean;
}

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#14243B] outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white focus:ring-2 focus:ring-orange-100';

export default function AccountInfoStep({
  register,
  errors,
  branches,
  isSuperAdmin,
}: AccountInfoStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#14243B]">
          Account & Assignment
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure the member's login credentials and branch.
        </p>
      </div>

      {/* Account credentials */}
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14243B]">
              Login Credentials
            </h3>
            <p className="text-xs text-slate-500">
              Set the initial password for the member account.
            </p>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-semibold text-[#14243B]">
            Initial Password <span className="text-[#F4510B]">*</span>
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter initial password"
              autoComplete="new-password"
              className={`${inputClass} pr-12`}
              {...register('password')}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#F4510B]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.password?.message && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-semibold text-[#14243B]">
            Confirm Password <span className="text-[#F4510B]">*</span>
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter initial password"
              autoComplete="new-password"
              className={`${inputClass} pr-12`}
              {...register('confirmPassword')}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((value) => !value)
              }
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#F4510B]"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.confirmPassword?.message && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-blue-700">
          <Info size={16} className="mt-0.5 shrink-0" />

          <p className="text-xs leading-5">
            The member can use the existing Forgot Password functionality
            to reset their password later.
          </p>
        </div>
      </section>

      {/* Branch Assignment */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Building2 size={20} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14243B]">
              Branch Assignment
            </h3>

            <p className="text-xs text-slate-500">
              Select the gym branch for this member.
            </p>
          </div>
        </div>

        {isSuperAdmin ? (
          <div>
            <label className="text-sm font-semibold text-[#14243B]">
              Select Branch <span className="text-[#F4510B]">*</span>
            </label>

            <select
              defaultValue=""
              className={inputClass}
              {...register('branchId')}
            >
              <option value="" disabled>
                Choose a branch
              </option>

              {branches
                .filter((branch) => branch.isActive)
                .map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
            </select>

            {errors.branchId?.message && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.branchId.message}
              </p>
            )}

            {branches.filter((branch) => branch.isActive).length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No active branches available. Create or activate a branch first.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4 text-green-700">
            <ShieldCheck size={19} className="mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-semibold">
                Automatic Branch Assignment
              </p>

              <p className="mt-1 text-xs leading-5">
                The member will automatically be assigned to your
                currently logged-in branch.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Trainer Assignment placeholder */}
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14243B]">
              Trainer Assignment
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Optional trainer assignment will be enabled after
              Trainer Management is integrated.
            </p>
          </div>
        </div>

        <span className="mt-4 inline-flex rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Coming in Trainer Management
        </span>
      </section>
    </div>
  );
}
