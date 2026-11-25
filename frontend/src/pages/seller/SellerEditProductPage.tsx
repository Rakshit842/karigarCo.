// Placeholder edit page — same form pre-filled with existing product data
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  shortDescription: z.string().optional(),
  price: z.number({ coerce: true }).positive(),
  comparePrice: z.number({ coerce: true }).positive().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  craftOrigin: z.string().optional(),
  stock: z.number({ coerce: true }).int().min(0).optional(),
});

export default function SellerEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productData } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => api.get(`/sellers/products`).then((r) => r.data.data.products?.find((p: any) => p.id === id)),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (productData) {
      reset({
        name: productData.name,
        description: productData.description,
        shortDescription: productData.shortDescription || '',
        price: Number(productData.price),
        comparePrice: productData.comparePrice ? Number(productData.comparePrice) : undefined,
        materials: productData.materials || '',
        dimensions: productData.dimensions || '',
        craftOrigin: productData.craftOrigin || '',
        stock: productData.inventory?.quantity || 0,
      });
    }
  }, [productData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Product updated — awaiting re-approval');
      navigate('/seller/products');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-earth-500 hover:text-forest-600"><ArrowLeft size={20} /></button>
        <h1 className="font-serif text-2xl font-bold text-earth-700">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Product Name *</label>
          <input {...register('name')} className="input-field" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Price (₹) *</label>
            <input {...register('price')} type="number" step="0.01" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Compare Price (₹)</label>
            <input {...register('comparePrice')} type="number" step="0.01" className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1.5">Description *</label>
          <textarea {...register('description')} rows={5} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Materials</label>
            <input {...register('materials')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Stock</label>
            <input {...register('stock')} type="number" className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Dimensions</label>
            <input {...register('dimensions')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">Craft Origin</label>
            <input {...register('craftOrigin')} className="input-field" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || updateMutation.isPending} className="btn-primary flex-1">
            {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/seller/products')} className="btn-secondary px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
