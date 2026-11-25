import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1, 'Select a category'),
  price: z.number({ coerce: true }).positive(),
  comparePrice: z.number({ coerce: true }).positive().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  craftOrigin: z.string().optional(),
  stock: z.number({ coerce: true }).int().min(0).optional(),
  isMadeToOrder: z.boolean().optional(),
  processingDays: z.number({ coerce: true }).int().optional(),
});

export default function SellerAddProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data.categories),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/products', data).then((r) => r.data.data.product),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Product created! Awaiting approval.');
      navigate('/seller/products');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create product'),
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-earth-500 hover:text-forest-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-serif text-2xl font-bold text-earth-700">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Product Name *</label>
          <input {...register('name')} className="input-field" placeholder="e.g. Blue Pottery Vase" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Category *</label>
          <select {...register('categoryId')} className="input-field">
            <option value="">Select category</option>
            {categoriesData?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message as string}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Price (₹) *</label>
            <input {...register('price')} type="number" step="0.01" className="input-field" placeholder="1500" />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Compare Price (₹)</label>
            <input {...register('comparePrice')} type="number" step="0.01" className="input-field" placeholder="2000" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Short Description</label>
          <input {...register('shortDescription')} className="input-field" placeholder="One-line summary (max 300 chars)" />
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Full Description *</label>
          <textarea {...register('description')} rows={5} className="input-field resize-none" placeholder="Describe your product — materials, technique, story, usage..." />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message as string}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Materials</label>
            <input {...register('materials')} className="input-field" placeholder="e.g. Shisham wood, beeswax" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Dimensions</label>
            <input {...register('dimensions')} className="input-field" placeholder="e.g. 25cm H × 15cm W" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Craft Origin</label>
            <input {...register('craftOrigin')} className="input-field" placeholder="e.g. Jaipur, Rajasthan" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Initial Stock</label>
            <input {...register('stock')} type="number" className="input-field" placeholder="10" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input {...register('isMadeToOrder')} type="checkbox" id="mto" className="rounded" />
          <label htmlFor="mto" className="text-sm text-earth-700">This is a made-to-order product</label>
        </div>

        <p className="text-xs text-earth-500 bg-cream-100 p-3 rounded-lg">
          After submission, your product will be reviewed by the KarigarCo. team before going live. This usually takes 1-2 business days.
        </p>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || createMutation.isPending} className="btn-primary flex-1">
            {isSubmitting || createMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
          </button>
          <button type="button" onClick={() => navigate('/seller/products')} className="btn-secondary px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
