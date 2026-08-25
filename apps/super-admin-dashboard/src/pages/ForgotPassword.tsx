import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPasswordApi } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const navigate = useNavigate();
  const [message, setMessage] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const onSubmit = async (data: ForgotFormData) => {
    try {
      setMessage('');
      setError('');
      await forgotPasswordApi(data);
      setMessage('OTP sent to your email! Redirecting to reset page...');
      setTimeout(() => navigate('/reset-password', { state: { email: data.email } }), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <div className="w-full max-w-md p-8 bg-[#1a1a1a] rounded-xl border border-[#333]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">MusclesMaster AI</h1>
        <h2 className="text-lg text-gray-300 mb-6 text-center">Forgot Password</h2>

        {message && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="off"
              className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded text-white focus:outline-none focus:border-orange-500"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-orange-500 hover:text-orange-400 text-sm">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}