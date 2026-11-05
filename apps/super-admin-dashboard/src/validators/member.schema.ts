
import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must contain at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),

  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must contain at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),

  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date < new Date();
    }, 'Please enter a valid past date'),

  mobile: z
    .string()
    .regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number'),

  email: z
    .string()
    .trim()
    .email('Enter a valid email address'),

  address: z
    .string()
    .trim()
    .max(250, 'Address cannot exceed 250 characters')
    .optional()
    .or(z.literal('')),
});

export const fitnessInfoSchema = z.object({
  height: z
    .number()
    .positive('Height must be greater than zero')
    .max(300, 'Enter a valid height')
    .optional(),

  weight: z
    .number()
    .positive('Weight must be greater than zero')
    .max(500, 'Enter a valid weight')
    .optional(),

  fitnessGoal: z.string().max(200).optional(),

  medicalConditions: z.array(z.string()).default([]),
});

export const accountInfoSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters'),

  branchId: z
    .string()
    .optional(),

  trainerId: z
    .string()
    .nullable()
    .optional(),
});


export const memberFormSchema = personalInfoSchema
  .extend(fitnessInfoSchema.shape)
  .extend(accountInfoSchema.shape)
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm the password'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  );

export type MemberFormInput = z.input<typeof memberFormSchema>;
export type MemberFormValues = z.output<typeof memberFormSchema>;

