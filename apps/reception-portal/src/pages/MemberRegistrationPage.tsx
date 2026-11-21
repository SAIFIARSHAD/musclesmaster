import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import {
  initialForm,
  registrationSteps,
  type RegistrationForm,
} from '../components/members/registration/RegistrationFormTypes';

import RegistrationProgress from '../components/members/registration/RegistrationProgress';
import PersonalDetailsStep from '../components/members/registration/PersonalDetailsStep';
import FitnessDetailsStep from '../components/members/registration/FitnessDetailsStep';
import MembershipStep from '../components/members/registration/MembershipStep';
import ReviewDetailsStep from '../components/members/registration/ReviewDetailsStep';
import RegistrationSuccess from '../components/members/registration/RegistrationSuccess';

import {
  getMembershipPlansApi,
  type MembershipPlan,
} from '../api/membershipPlans.api';

import {
  getReceptionTrainersApi,
  type Trainer,
} from '../api/trainers.api';

import {
  createMemberApi,
  type CreatedMember,
} from '../api/members.api';

import { assignMembershipApi } from '../api/memberships.api';

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message || fallback;
  }

  return fallback;
};

export default function MemberRegistrationPage() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState<RegistrationForm>(initialForm);

  // Registration steps
  const [currentStep, setCurrentStep] = useState(1);

  // Membership and trainer data
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  // Registration state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdMember, setCreatedMember] =
    useState<CreatedMember | null>(null);

  const [registrationCompleted, setRegistrationCompleted] =
    useState(false);

  const selectedPlan =
    plans.find((plan) => plan._id === selectedPlanId) ?? null;



  // Update form fields
  const updateField = (field: keyof RegistrationForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError('');
  };

  // Load plans and trainers when Membership step opens
  useEffect(() => {
    if (currentStep !== 3) return;

    let cancelled = false;

    const loadOptions = async () => {
      setLoadingOptions(true);
      setOptionsError('');

      const [plansResult, trainersResult] = await Promise.allSettled([
        getMembershipPlansApi(),
        getReceptionTrainersApi(),
      ]);

      if (cancelled) return;

      if (plansResult.status === 'fulfilled') {
        setPlans(plansResult.value);
      } else {
        setPlans([]);
        setOptionsError(
          'Unable to load membership plans. Please go back and retry.',
        );
      }

      if (trainersResult.status === 'fulfilled') {
        setTrainers(trainersResult.value);
      } else {
        setTrainers([]);
      }

      setLoadingOptions(false);
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [currentStep]);

  // Step 1 validation
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

    if (!form.dob || form.dob > getLocalDate()) {
      return 'Please select a valid date of birth.';
    }

    if (!form.gender) {
      return 'Please select gender.';
    }

    if (form.password.length < 8) {
      return 'Password must contain at least 8 characters.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Password and confirm password do not match.';
    }

    return '';
  };

  // Step 2 validation
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
      return 'Please enter weight or clear the height field.';
    }

    if (form.weight.trim() && !form.height.trim()) {
      return 'Please enter height or clear the weight field.';
    }

    return '';
  };

  // Step 3 validation
  const validateMembershipDetails = () => {
    if (loadingOptions) {
      return 'Please wait while membership options are loading.';
    }

    if (optionsError) {
      return optionsError;
    }

    if (!selectedPlan) {
      return 'Please select an active membership plan.';
    }

    if (selectedPlan.ptIncluded && !selectedTrainerId) {
      return 'This membership plan requires a personal trainer.';
    }

    return '';
  };

  // Navigation and step validation
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
    } else if (currentStep === 2) {
      const validationError = validateFitnessDetails();

      if (validationError) {
        setError(validationError);
        return;
      }

      setCurrentStep(3);
    } else if (currentStep === 3) {
      const validationError = validateMembershipDetails();

      if (validationError) {
        setError(validationError);
        return;
      }

      setCurrentStep(4);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final registration API flow
  const handleRegisterMember = async () => {
    setError('');

    if (!selectedPlan) {
      setError('Please select a membership plan.');
      return;
    }

    if (selectedPlan.ptIncluded && !selectedTrainerId) {
      setError('Please assign a trainer for this membership plan.');
      return;
    }

    setSubmitting(true);

    try {
      let member = createdMember;

      // Create member only once.
      // If membership assignment previously failed, reuse this member.
      if (!member) {
        const memberPayload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gender: form.gender as 'MALE' | 'FEMALE' | 'OTHER',
          dob: form.dob,
          mobile: form.mobile.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          address: form.address.trim() || undefined,
          height: form.height ? Number(form.height) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          fitnessGoal: form.fitnessGoal || undefined,
          medicalConditions: form.medicalConditions
            .split(',')
            .map((condition) => condition.trim())
            .filter(Boolean),
          trainerId: selectedTrainerId || undefined,
        };

        const result = await createMemberApi(memberPayload);

        member = result.member;
        setCreatedMember(member);
      }

      // Assign membership to the created member
      await assignMembershipApi({
        memberId: member._id,
        planId: selectedPlanId,
        startDate: getLocalDate(),
      });

      setRegistrationCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const fallback = createdMember
        ? 'Member is already created, but membership assignment failed. Please retry.'
        : 'Unable to register member. Please check the details and try again.';

      setError(getApiErrorMessage(err, fallback));
    } finally {
      setSubmitting(false);
    }
  };

  // Start another registration
  const handleRegisterAnother = () => {
    setForm(initialForm);
    setCurrentStep(1);

    setSelectedPlanId('');
    setSelectedTrainerId('');

    setCreatedMember(null);
    setRegistrationCompleted(false);

    setError('');
    setOptionsError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Registration success screen
  if (registrationCompleted && createdMember) {
    return (
      <div className="mx-auto max-w-5xl">
        <RegistrationSuccess
          memberName={`${createdMember.firstName} ${createdMember.lastName}`}
          memberId={createdMember.memberId}
          membershipStatus="PENDING"
          onGoToMembers={() => navigate('/members')}
          onRegisterAnother={handleRegisterAnother}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Heading */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#F4510B]"
        >
          <ArrowLeft size={16} />
          Back to Members
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#14243B]">
            Register New Member
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Complete the registration process step by step.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-7 sm:py-6">  
        <RegistrationProgress
          currentStep={currentStep}
          steps={registrationSteps}
        />
      </div>

      {/* Registration Form */}
      <form
        onSubmit={handleContinue}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="px-5 py-6 sm:px-7">
          {currentStep === 1 && (
            <PersonalDetailsStep
              form={form}
              updateField={updateField}
            />
          )}

          {currentStep === 2 && (
            <FitnessDetailsStep
              form={form}
              updateField={updateField}
            />
          )}

          {currentStep === 3 && (
            <MembershipStep
              plans={plans}
              trainers={trainers}
              selectedPlanId={selectedPlanId}
              selectedTrainerId={selectedTrainerId}
              onPlanChange={(value) => {
                setSelectedPlanId(value);
                setError('');
              }}
              onTrainerChange={(value) => {
                setSelectedTrainerId(value);
                setError('');
              }}
              loadingOptions={loadingOptions}
              optionsError={optionsError}
            />
          )}

          {currentStep === 4 && (
            <ReviewDetailsStep
              form={form}
              plans={plans}
              trainers={trainers}
              selectedPlanId={selectedPlanId}
              selectedTrainerId={selectedTrainerId}
              onEdit={(step) => {
                setError('');
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
            {error}

            {createdMember && (
              <p className="mt-1 text-xs">
                Member ID: {createdMember.memberId}. Retrying will only retry
                membership assignment.
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (currentStep === 1) {
                navigate('/members');
                return;
              }

              setError('');
              setCurrentStep((previous) => previous - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < 4 ? (
            <button
              type="submit"
              disabled={loadingOptions && currentStep === 3}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentStep === 1
                ? 'Continue to Fitness Details'
                : currentStep === 2
                  ? 'Continue to Membership'
                  : 'Review Registration'}

              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleRegisterMember}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  {createdMember
                    ? 'Assigning Membership...'
                    : 'Registering Member...'}
                </>
              ) : createdMember ? (
                'Retry Membership Assignment'
              ) : (
                'Register Member'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
