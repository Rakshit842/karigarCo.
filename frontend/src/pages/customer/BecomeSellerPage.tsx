import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { useAuthStore } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle } from 'lucide-react';

const schema = z.object({
  shopName: z.string().min(3, 'At least 3 characters').max(100),
  description: z.string().min(20, 'At least 20 characters'),
  craftSpecialization: z.string().min(3),
  phone: z.string().min(10),
  businessAddress: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pinCode: z.string().regex(/^\d{6}$/, 'Invalid PIN'),
});

export default function BecomeSellerPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await api.post('/sellers/apply', data);
      toast.success('Application submitted!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not submit application');
      throw err;
    }
  };

  if (isSubmitSuccessful) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <CheckCircle size={64} className="text-forest-500 mx-auto mb-6" />
      <h1 className="font-serif text-3xl font-bold text-earth-700 mb-3">Application Submitted!</h1>
      <p className="text-earth-600 mb-6">We'll review your application and get back to you within 2-3 business days. You'll receive an email once approved.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="section-title">Become a Seller on KarigarCo.</h1>
        <p className="section-subtitle max-w-xl mx-auto">
          Join thousands of artisans who've found new customers through India's most trusted handcrafted marketplace
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
        {[
          { title: 'Free Setup', desc: 'Create your store for free — no upfront fees' },
          { title: 'Wide Reach', desc: 'Access customers across India' },
          { title: 'Easy Management', desc: 'Manage products, orders and earnings from one dashboard' },
          { title: 'Transparent Earnings', desc: 'Clear commission structure — know exactly what you earn' },
        ].map(({ title, desc }) => (
          <div key={title} className="card p-5 text-center">
            <h3 className="font-semibold text-earth-700 mb-1 text-sm">{title}</h3>
            <p className="text-xs text-earth-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-6">Seller Application</h2>

          {!isAuthenticated && (
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6 text-sm text-earth-700">
              You need to <Link to="/login" className="text-forest-600 font-medium hover:underline">sign in</Link> or <Link to="/register" className="text-forest-600 font-medium hover:underline">create an account</Link> before applying as a seller.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Shop / Business Name *</label>
              <input {...register('shopName')} placeholder="e.g. Meera's Pottery Studio" className="input-field" />
              {errors.shopName && <p className="text-xs text-red-500 mt-1">{errors.shopName.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Craft Specialization *</label>
              <input {...register('craftSpecialization')} placeholder="e.g. Blue Pottery, Terracotta, Bastar Woodcraft" className="input-field" />
              {errors.craftSpecialization && <p className="text-xs text-red-500 mt-1">{errors.craftSpecialization.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">About Your Business *</label>
              <textarea {...register('description')} rows={4} placeholder="Tell us about your craft, your products and your story (at least 20 characters)" className="input-field resize-none" />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Phone Number *</label>
              <input {...register('phone')} type="tel" placeholder="9876543210" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Business Address *</label>
              <input {...register('businessAddress')} placeholder="Street address, locality" className="input-field" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input {...register('city')} placeholder="City" className="input-field" />
              </div>
              <div>
                <input {...register('state')} placeholder="State" className="input-field" />
              </div>
              <div>
                <input {...register('pinCode')} placeholder="PIN Code" className="input-field" />
                {errors.pinCode && <p className="text-xs text-red-500 mt-1">{errors.pinCode.message as string}</p>}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !isAuthenticated} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? 'Submitting...' : (<>Submit Application <ArrowRight size={16} /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
