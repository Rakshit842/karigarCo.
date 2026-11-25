import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email() })),
  });
  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await authService.forgotPassword(email);
      toast.success('Reset link sent if email exists');
    } catch { toast.error('Something went wrong'); }
  };
  if (isSubmitSuccessful) return (
    <div className="card p-8 text-center">
      <h2 className="font-serif text-xl font-bold text-earth-700 mb-3">Check your email</h2>
      <p className="text-earth-600 text-sm mb-4">If your email is registered, you'll receive a password reset link shortly.</p>
      <Link to="/login" className="text-forest-600 text-sm hover:underline">Back to sign in</Link>
    </div>
  );
  return (
    <div className="card p-8">
      <h2 className="font-serif text-2xl font-bold text-earth-700 mb-1">Forgot password</h2>
      <p className="text-earth-500 text-sm mb-6">We'll send a reset link to your email</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-center text-sm text-earth-600 mt-5">
        <Link to="/login" className="text-forest-600 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
