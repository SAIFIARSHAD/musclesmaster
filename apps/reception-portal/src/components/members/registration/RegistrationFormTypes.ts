export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export interface RegistrationForm {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  gender: Gender | '';
  address: string;

  height: string;
  weight: string;
  fitnessGoal: string;
  medicalConditions: string;
}

export const initialForm: RegistrationForm = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
  dob: '',
  gender: '',
  address: '',

  height: '',
  weight: '',
  fitnessGoal: '',
  medicalConditions: '',
};

export const registrationSteps = [
  'Personal Details',
  'Fitness Details',
  'Membership & Trainer',
  'Review & Confirm',
];
