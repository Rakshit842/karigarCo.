import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch {
      toast.error('Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-earth-700 text-cream-100">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1 bg-[#eeeae0] text-earth-700 rounded-lg p-5">
            <img src="/logo.png" alt="KarigarCo." className="h-10 w-auto object-contain mb-4" />
            <p className="text-sm text-earth-600 leading-relaxed mb-5">
              Connecting India's traditional artisans with customers who value authentic, handcrafted products.
            </p>
            <p className="text-xs text-earth-500 italic">"Crafted by hands. Rooted in heritage."</p>

            {/* Social */}
            <div className="flex gap-4 mt-5">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="w-9 h-9 rounded-full border border-cream-600 flex items-center justify-center text-cream-400 hover:text-gold-400 hover:border-gold-400 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-cream-100 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/shop', label: 'All Products' },
                { to: '/shop?categoryId=pottery-ceramics', label: 'Pottery & Ceramics' },
                { to: '/shop?categoryId=wooden-crafts', label: 'Wooden Crafts' },
                { to: '/shop?categoryId=home-decor', label: 'Home Décor' },
                { to: '/shop?categoryId=art-wall-decor', label: 'Art & Wall Décor' },
                { to: '/artisans', label: 'Meet the Artisans' },
              ].map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm text-cream-400 hover:text-gold-300 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-cream-100 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/about', label: 'Our Story' },
                { to: '/become-seller', label: 'Become a Seller' },
                { to: '/about#philosophy', label: 'Our Philosophy' },
              ].map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm text-cream-400 hover:text-gold-300 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-cream-100 mb-4">Stay Connected</h4>
            <p className="text-sm text-cream-400 mb-4">Get stories, new arrivals and artisan features in your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-earth-600 border border-earth-500 rounded-md px-4 py-2.5 text-sm text-cream-100 placeholder-cream-500 focus:outline-none focus:border-gold-400 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gold-400 text-earth-800 py-2.5 rounded-md text-sm font-medium hover:bg-gold-300 transition-colors disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-earth-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream-500">© {new Date().getFullYear()} KarigarCo. by Viraasat. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {['Privacy Policy', 'Terms & Conditions', 'Shipping Policy', 'Returns & Refunds', 'FAQs'].map((item) => (
              <Link key={item} to="/about" className="text-xs text-cream-500 hover:text-gold-300 transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
