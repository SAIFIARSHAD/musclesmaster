import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBranchesApi, type Branch } from '../api/branch.api';
import {
  createMemberApi,
  type CreateMemberPayload,
} from '../api/member.api';
import {
  memberFormSchema,
  type MemberFormInput,
  type MemberFormValues,
} from '../validators/member.schema';
import MemberFormStepper from '../components/members/MemberFormStepper';
import PersonalInfoStep from '../components/members/PersonalInfoStep';
import FitnessInfoStep from '../components/members/FitnessInfoStep';
import AccountInfoStep from '../components/members/AccountInfoStep';
import ReviewMemberStep from '../components/members/ReviewMemberStep';

const TOTAL_STEPS = 4;

const defaultValues: MemberFormInput = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dob: '',
  mobile: '',
  email: '',
  address: '',
  height: undefined,
  weight: undefined,
  fitnessGoal: '',
  medicalConditions: [],
  password: '',
  confirmPassword: '',
  branchId: '',
  trainerId: null,
};

export default function AddMember() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [currentStep, setCurrentStep] = useState(1);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const {
    register,
    watch,
    trigger,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormInput, undefined, MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  // Load branches for Super Admin
  useEffect(() => {
    if (!isSuperAdmin) return;

    let isMounted = true;

    const loadBranches = async () => {
      try {
        setBranchesLoading(true);
        setBranchesError('');

        const result = await getBranchesApi();

        if (isMounted) {
          setBranches(result);
        }
      } catch (error) {
        console.error('Failed to load branches:', error);

        if (isMounted) {
          setBranchesError('Unable to load branches. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setBranchesLoading(false);
        }
      }
    };

    void loadBranches();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  // Move to next step after validating current step
  const handleNext = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    let fieldsToValidate: (keyof MemberFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = [
        'firstName',
        'lastName',
        'gender',
        'dob',
        'mobile',
        'email',
        'address',
      ];
    }

    if (currentStep === 2) {
      fieldsToValidate = [
        'height',
        'weight',
        'fitnessGoal',
        'medicalConditions',
      ];
    }

    if (currentStep === 3) {
      fieldsToValidate = ['password', 'confirmPassword'];

      if (isSuperAdmin) {
        fieldsToValidate.push('branchId');
      }
    }

    const isValid = await trigger(fieldsToValidate);

    if (!isValid) return;

    // Super Admin must select a branch
    if (currentStep === 3 && isSuperAdmin && !getValues('branchId')) {
      setError('branchId', {
        type: 'manual',
        message: 'Please select a branch',
      });

      return;
    }

    clearErrors();
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
  };

  // Go back to previous step
  const handlePrevious = () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  // Register member - called ONLY by Register Member button
  const onSubmit = async (values: MemberFormValues) => {
    if (isSubmitting) return;

    setSubmitError('');
    setSubmitSuccess('');

    try {
      const {
        confirmPassword,
        ...formData
      } = values;

      const payload: CreateMemberPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address?.trim() || undefined,
        height: formData.height,
        weight: formData.weight,
        fitnessGoal: formData.fitnessGoal?.trim() || undefined,
        medicalConditions: formData.medicalConditions || [],
      };

      // Super Admin branch selection
      if (isSuperAdmin) {
        if (!formData.branchId) {
          setError('branchId', {
            type: 'manual',
            message: 'Please select a branch',
          });

          setCurrentStep(3);
          return;
        }

        payload.branchId = formData.branchId;
      }

      const createdMember = await createMemberApi(payload);

      setSubmitSuccess(
        `Member ${createdMember.member.memberId} registered successfully.`
      );

      setTimeout(() => {
        navigate('/members');
      }, 1200);
    } catch (error) {
      console.error('Member registration failed:', error);

      if (axios.isAxiosError<{ message?: string }>(error)) {
        setSubmitError(
          error.response?.data?.message ||
            'Unable to register member. Please try again.'
        );
      } else {
        setSubmitError(
          'Something went wrong while registering the member.'
        );
      }
    }
  };

  // IMPORTANT:
  // Native form submission is disabled.
  // Continue buttons cannot trigger member registration.
  const handleFormSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <button
            type="button"
            onClick={() => navigate('/members')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#F4510B]"
          >
            <ArrowLeft size={17} />
            Back to Members
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
              <UserPlus size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#14243B]">
                Add New Member
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Register a new member in your gym.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
          <p className="text-xs text-slate-400">
            Registration step
          </p>

          <p className="mt-1 text-sm font-bold text-[#14243B]">
            {currentStep} of {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >

        {/* Stepper */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <MemberFormStepper currentStep={currentStep} />
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:mx-6">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="text-sm font-medium text-red-600">
              {submitError}
            </p>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:mx-6">
            <Check
              size={19}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <p className="text-sm font-medium text-green-700">
              {submitSuccess}
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[350px] p-5 sm:p-7">

          {currentStep === 1 && (
            <PersonalInfoStep
              register={register}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <FitnessInfoStep
              register={register}
              watch={watch}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <>
              {isSuperAdmin && branchesError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {branchesError}
                </div>
              )}

              {isSuperAdmin && branchesLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" />
                  Loading branches...
                </div>
              ) : (
                <AccountInfoStep
                  register={register}
                  errors={errors}
                  branches={branches}
                  isSuperAdmin={isSuperAdmin}
                />
              )}
            </>
          )}

          {currentStep === 4 && (
            <ReviewMemberStep
              values={watch()}
              branches={branches}
            />
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={17} />
            Previous
          </button>

          {/* Continue / Register */}
          {currentStep < TOTAL_STEPS ? (
            <button
              key="continue-button"
              type="button"
              onClick={handleNext}
              disabled={isSuperAdmin && currentStep === 3 && branchesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D94308] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              key="register-button"
              type="button"
              disabled={isSubmitting || !!submitSuccess}
              onClick={() => {
                // API is triggered only by this explicit button click.
                void handleSubmit(onSubmit)();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-7 py-3 text-sm font-semibold text-white shadow-md shadow-orange-100 transition hover:bg-[#D94308] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Registering...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Register Member
                </>
              )}
            </button>
          )}

        </div>
      </form>

      {/* Footer Note */}
      <p className="px-2 text-xs leading-5 text-slate-400">
        Member registration creates an inactive account. Membership,
        payment and activation will be handled through the Membership module.
      </p>

    </div>
  );
}
