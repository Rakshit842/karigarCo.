import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.register(data);
      toast.success('Account created! Please verify your email.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="card p-8">
      <h2 className="font-serif text-2xl font-bold text-earth-700 mb-1">Create account</h2>
      <p className="text-earth-500 text-sm mb-6">Join KarigarCo. — discover handcrafted India</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">First Name</label>
            <input {...register('firstName')} placeholder="Priya" className="input-field" />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Last Name</label>
            <input {...register('lastName')} placeholder="Nair" className="input-field" />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Phone (optional)</label>
          <input {...register('phone')} type="tel" placeholder="9876543210" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
          <input {...register('password')} type="password" placeholder="Min 8 chars, mixed case + number" className="input-field" />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-earth-600 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-forest-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
