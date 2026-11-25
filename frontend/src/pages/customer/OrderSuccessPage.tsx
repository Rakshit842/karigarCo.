import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/shop.service';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const { data } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <CheckCircle size={64} className="text-forest-500 mx-auto mb-6" />
      <h1 className="font-serif text-3xl font-bold text-earth-700 mb-3">Order Placed!</h1>
      {data && (
        <p className="text-earth-600 mb-2">
          Order <span className="font-semibold">#{data.orderNumber}</span> has been confirmed.
        </p>
      )}
      <p className="text-earth-500 mb-8">
        Our artisans are preparing your handcrafted products. You'll receive an update when your order ships.
      </p>

      {data && (
        <div className="card p-5 text-left mb-8">
          <h3 className="font-semibold text-earth-700 mb-3">Order Summary</h3>
          {data.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-earth-600 py-1.5 border-b border-earth-50 last:border-0">
              <span>{item.productName} ×{item.quantity}</span>
              <span>₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-earth-700 mt-3 pt-2 border-t border-earth-100">
            <span>Total</span>
            <span>₹{Number(data.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link to="/orders" className="btn-primary flex items-center gap-2">
          <Package size={16} />
          View Orders
        </Link>
        <Link to="/shop" className="btn-secondary flex items-center gap-2">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
