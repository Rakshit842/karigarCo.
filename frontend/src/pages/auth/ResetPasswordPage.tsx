import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }: z.infer<typeof schema>) => {
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="card p-8">
      <h2 className="font-serif text-2xl font-bold text-earth-700 mb-6">Set new password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">New Password</label>
          <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Confirm Password</label>
          <input {...register('confirm')} type="password" className="input-field" placeholder="••••••••" />
          {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
