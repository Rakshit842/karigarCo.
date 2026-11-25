import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const { user } = useAuthStore.getState();
      toast.success(`Welcome back, ${user?.firstName}!`);
      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'SELLER') navigate('/seller/dashboard');
      else navigate(from);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="card p-8">
      <h2 className="font-serif text-2xl font-bold text-earth-700 mb-1">Sign in</h2>
      <p className="text-earth-500 text-sm mb-6">Welcome back to KarigarCo.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-earth-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-forest-600 hover:underline">Forgot password?</Link>
          </div>
          <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-earth-600 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-forest-600 font-medium hover:underline">Create account</Link>
      </p>
    </div>
  );
}
