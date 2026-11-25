import { useAuthStore } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

export default function AccountPage() {
  const { user, initialize } = useAuthStore();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data: any) => {
    try {
      await api.patch('/users/profile', data);
      await initialize();
      toast.success('Profile updated');
    } catch { toast.error('Could not update profile'); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="section-title mb-6">My Account</h1>
      <div className="card p-6 mb-5">
        <h2 className="font-semibold text-earth-700 mb-4">Profile Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">First Name</label>
              <input {...register('firstName')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Last Name</label>
              <input {...register('lastName')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Email</label>
            <input value={user?.email} disabled className="input-field bg-cream-50 text-earth-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Phone</label>
            <input {...register('phone')} className="input-field" placeholder="9876543210" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/orders" className="card p-5 text-center hover:shadow-md transition-shadow">
          <p className="font-semibold text-earth-700">My Orders</p>
          <p className="text-xs text-earth-500 mt-1">Track & manage orders</p>
        </Link>
        <Link to="/wishlist" className="card p-5 text-center hover:shadow-md transition-shadow">
          <p className="font-semibold text-earth-700">Wishlist</p>
          <p className="text-xs text-earth-500 mt-1">Your saved products</p>
        </Link>
      </div>
    </div>
  );
}
