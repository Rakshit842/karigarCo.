import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="section-title">Our Story</h1>
        <p className="section-subtitle">KarigarCo. by Viraasat — built on the belief that craft deserves a future</p>
      </div>

      <div className="prose max-w-none">
        <div className="card p-8 mb-8">
          <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-4">Why KarigarCo. exists</h2>
          <p className="text-earth-600 leading-relaxed mb-4">
            India is home to one of the world's greatest craft heritages. Thousands of craft traditions — pottery from Rajasthan, tribal woodwork from Chhattisgarh, blue pottery from Jaipur, brass craft from Moradabad, handloom weaving from Varanasi — have been refined over centuries, passed through families, embedded in the culture of entire regions.
          </p>
          <p className="text-earth-600 leading-relaxed mb-4">
            Yet many artisans struggle to reach customers beyond their local markets. Supply chains are fragmented, margins are thin, and the digital transition has been slow and uneven. The craftsperson remains invisible behind their craft.
          </p>
          <p className="text-earth-600 leading-relaxed">
            KarigarCo. is built to change this. We exist to give artisans a dignified, direct channel to customers who value handmade work — and to give customers the access, context and confidence to purchase from real craftspeople.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6 bg-forest-50 border-forest-100">
            <h3 className="font-serif text-xl font-semibold text-earth-700 mb-3">For Artisans</h3>
            <p className="text-earth-600 text-sm leading-relaxed">A complete digital storefront. Product management. Direct orders. Transparent earnings. No technical knowledge required.</p>
          </div>
          <div className="card p-6 bg-gold-50 border-gold-100">
            <h3 className="font-serif text-xl font-semibold text-earth-700 mb-3">For Customers</h3>
            <p className="text-earth-600 text-sm leading-relaxed">Authentic, verified handmade products. Artisan stories. Regional origins. Secure checkout. And the knowledge that your purchase directly supports a craftsperson.</p>
          </div>
        </div>

        <div className="card p-8 bg-earth-700 text-cream-100 text-center">
          <p className="font-serif text-2xl font-semibold text-gold-300 mb-4">"Crafted by hands. Rooted in heritage."</p>
          <p className="text-cream-300 text-sm leading-relaxed mb-6">Every purchase you make on KarigarCo. goes directly toward sustaining a craft tradition. That is not incidental — it is the whole point.</p>
          <Link to="/become-seller" className="inline-flex items-center gap-2 bg-gold-400 text-earth-800 px-6 py-3 rounded-md font-medium hover:bg-gold-300 transition-colors">
            Become a Seller <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
