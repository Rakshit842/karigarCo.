import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService, orderService, paymentService, addressService } from '../../services/shop.service';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

declare const Razorpay: any;

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pinCode: z.string().regex(/^\d{6}$/, 'Invalid PIN'),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [_step, _setStep] = useState<'address' | 'payment'>('address');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: cartService.getCart });
  const { data: addresses, refetch: refetchAddresses } = useQuery({ queryKey: ['addresses'], queryFn: addressService.getAddresses });

  const addressForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  const addAddressMutation = useMutation({
    mutationFn: (data: AddressForm) => addressService.addAddress({ ...data, isDefault: false }),
    onSuccess: (addr) => {
      setSelectedAddressId(addr.id);
      setShowAddressForm(false);
      refetchAddresses();
    },
  });

  const placeOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }

    try {
      const order = await orderService.createOrder({
        addressId: selectedAddressId,
        couponCode: couponCode || undefined,
      });

      // Attempt Razorpay payment
      try {
        const rzpOrder = await paymentService.createRazorpayOrder(order.id);

        const rzp = new Razorpay({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          order_id: rzpOrder.razorpayOrderId,
          name: 'KarigarCo.',
          description: `Order ${order.orderNumber}`,
          theme: { color: '#2d5016' },
          handler: async (response: any) => {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order.id,
            });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['cart-count'] });
            toast.success('Payment successful!');
            navigate(`/order-success/${order.id}`);
          },
        });
        rzp.open();
      } catch {
        // Razorpay not configured — still treat as COD success for demo
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['cart-count'] });
        toast.success('Order placed! (Payment gateway not configured — demo mode)');
        navigate(`/order-success/${order.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not place order');
    }
  };

  const subtotal = cart?.total || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Address */}
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-earth-700 mb-4">Delivery Address</h2>

            {/* Saved addresses */}
            {addresses?.length ? (
              <div className="space-y-3 mb-4">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-forest-500 bg-forest-50' : 'border-earth-100 hover:border-earth-200'}`}>
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-earth-700 text-sm">{addr.fullName}</p>
                      <p className="text-earth-600 text-sm">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-earth-600 text-sm">{addr.city}, {addr.state} — {addr.pinCode}</p>
                      <p className="text-earth-500 text-xs">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : null}

            {/* Add address form */}
            {showAddressForm ? (
              <form onSubmit={addressForm.handleSubmit((d) => addAddressMutation.mutate(d))} className="space-y-3 mt-4 border-t border-earth-100 pt-4">
                <h3 className="font-medium text-earth-700 text-sm">Add New Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...addressForm.register('fullName')} placeholder="Full Name" className="input-field text-sm py-2.5" />
                    {addressForm.formState.errors.fullName && <p className="text-xs text-red-500 mt-1">{addressForm.formState.errors.fullName.message}</p>}
                  </div>
                  <input {...addressForm.register('phone')} placeholder="Phone" className="input-field text-sm py-2.5" />
                </div>
                <input {...addressForm.register('line1')} placeholder="Address Line 1" className="input-field text-sm py-2.5" />
                <input {...addressForm.register('line2')} placeholder="Address Line 2 (optional)" className="input-field text-sm py-2.5" />
                <div className="grid grid-cols-3 gap-3">
                  <input {...addressForm.register('city')} placeholder="City" className="input-field text-sm py-2.5" />
                  <input {...addressForm.register('state')} placeholder="State" className="input-field text-sm py-2.5" />
                  <div>
                    <input {...addressForm.register('pinCode')} placeholder="PIN Code" className="input-field text-sm py-2.5" />
                    {addressForm.formState.errors.pinCode && <p className="text-xs text-red-500 mt-1">{addressForm.formState.errors.pinCode.message}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={addAddressMutation.isPending} className="btn-primary text-sm py-2.5">Save Address</button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary text-sm py-2.5">Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowAddressForm(true)} className="text-sm text-forest-600 hover:underline">
                + Add new address
              </button>
            )}
          </div>

          {/* Coupon */}
          <div className="card p-6">
            <h2 className="font-semibold text-earth-700 mb-3">Coupon Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                className="input-field"
              />
              <button className="btn-secondary px-5 py-3 whitespace-nowrap">Apply</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="font-semibold text-earth-700 mb-4">Order Summary</h3>

            <div className="space-y-2 mb-4 text-sm max-h-48 overflow-y-auto">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between text-earth-600">
                  <span className="truncate pr-2">{item.product.name} ×{item.quantity}</span>
                  <span className="flex-shrink-0">₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-earth-100 pt-3 space-y-2 text-sm mb-4">
              <div className="flex justify-between text-earth-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-earth-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-forest-600">Free</span> : `₹${shipping}`}</span>
              </div>
            </div>

            <div className="border-t border-earth-100 pt-3 mb-5">
              <div className="flex justify-between font-semibold text-earth-700">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={!selectedAddressId}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Order & Pay
            </button>
            <p className="text-xs text-earth-500 text-center mt-3">
              Powered by Razorpay — secure checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
