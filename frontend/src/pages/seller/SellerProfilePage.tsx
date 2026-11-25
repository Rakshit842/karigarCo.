import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function SellerProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: () => api.get('/sellers/me').then((r) => r.data.data.seller),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.patch('/sellers/profile', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Store profile updated');
    },
    onError: () => toast.error('Could not update profile'),
  });

  if (isLoading) return <div className="max-w-2xl"><div className="h-64 skeleton rounded-xl" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Store Profile</h1>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Shop Name</label>
          <input {...register('shopName')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Craft Specialization</label>
          <input {...register('craftSpecialization')} className="input-field" placeholder="e.g. Blue Pottery, Bastar Woodcraft" />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">About Your Store</label>
          <textarea {...register('description')} rows={4} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Your Artisan Story</label>
          <textarea {...register('artisanStory')} rows={4} className="input-field resize-none" placeholder="Tell customers your story..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Store Logo URL</label>
          <input {...register('logoUrl')} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Cover Image URL</label>
          <input {...register('coverImageUrl')} className="input-field" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">City</label>
            <input {...register('city')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">State</label>
            <input {...register('state')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">PIN</label>
            <input {...register('pinCode')} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Phone</label>
          <input {...register('phone')} type="tel" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">UPI ID (for payouts)</label>
          <input {...register('upiId')} className="input-field" placeholder="yourname@upi" />
        </div>
        <button type="submit" disabled={isSubmitting || updateMutation.isPending} className="btn-primary">
          {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
