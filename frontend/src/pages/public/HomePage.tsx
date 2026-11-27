import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Leaf, Award, Shield, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import type { Category } from '../../types';

const categories = [
  { name: 'Pottery & Ceramics', slug: 'pottery-ceramics', emoji: '🏺', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80' },
  { name: 'Wooden Crafts', slug: 'wooden-crafts', emoji: '🪵', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { name: 'Brass & Metal', slug: 'metal-crafts', emoji: '🔔', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80' },
  { name: 'Home Décor', slug: 'home-decor', emoji: '🏠', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { name: 'Handwoven', slug: 'handwoven', emoji: '🧺', image: 'https://images.unsplash.com/photo-1588436706487-9d55d73a39e3?w=400&q=80' },
  { name: 'Art & Wall Décor', slug: 'art-wall-decor', emoji: '🎨', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80' },
];

const collections = [
  { title: 'Handmade for Your Home', desc: 'Artisan pieces that bring warmth to every space', href: '/shop?featured=true', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' },
  { title: 'Made in India', desc: 'Celebrating regional craft traditions from across the country', href: '/shop', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80' },
  { title: 'Thoughtful Gifting', desc: 'Meaningful, handcrafted gifts for every occasion', href: '/shop', img: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=600&q=80' },
];

export default function HomePage() {
  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.list({ featured: true, limit: 8 }),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-earth-700/85 via-earth-700/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-gold-300 text-sm tracking-widest uppercase font-medium mb-4">Crafted by hands. Rooted in Heritage</p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Tradition,<br />
              <span className="text-gold-300">Crafted</span><br />
              for Today.
            </h1>
            <p className="text-cream-200 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Discover India's finest handmade products, directly from the artisans who craft them with generations of skill and passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="btn-gold flex items-center justify-center gap-2 text-base px-8 py-4">
                Explore Collection
                <ArrowRight size={18} />
              </Link>
              <Link to="/artisans" className="btn-secondary border-cream-200 text-cream-100 hover:bg-white/10 flex items-center justify-center gap-2 text-base px-8 py-4">
                Meet Our Artisans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-forest-600 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Leaf, label: 'Sustainably Sourced' },
              { icon: Award, label: 'Verified Artisans' },
              { icon: Shield, label: 'Secure Payments' },
              { icon: Truck, label: 'Pan-India Delivery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-cream-100 justify-center">
                <Icon size={18} className="text-gold-300" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Explore by Craft</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Each category celebrates a unique tradition of Indian craftsmanship
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?categorySlug=${cat.slug}`}
              className="group text-center"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-cream-100 product-img-zoom border border-earth-100">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-medium text-earth-700 group-hover:text-forest-600 transition-colors leading-tight">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Handpicked pieces by our artisans</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center gap-1 text-sm font-medium text-forest-600 hover:text-forest-700">
              View all <ChevronRight size={16} />
            </Link>
          </div>

          {featuredData?.products.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 skeleton rounded w-3/4" />
                    <div className="h-4 skeleton rounded" />
                    <div className="h-3 skeleton rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to="/shop" className="btn-secondary inline-flex items-center gap-2">View all products <ChevronRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-16 md:py-20 bg-forest-600 text-white" id="philosophy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold-300 text-sm tracking-widest uppercase font-medium mb-4">Our Philosophy</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
            Craft is living heritage
          </h2>
          <p className="text-cream-200 text-base md:text-lg leading-relaxed mb-6">
            India's artisans carry centuries of knowledge in their hands. Each piece they create is not merely a product — it is a practice, a story, an act of cultural preservation. KarigarCo. exists to ensure that this heritage thrives, that artisans earn a dignified livelihood, and that the people who value handmade work can find it, understand it, and cherish it.
          </p>
          <p className="text-cream-300 text-sm leading-relaxed">
            We work directly with craftspeople across India's craft clusters — connecting their workshops to customers who care.
          </p>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Curated Collections</h2>
          <p className="section-subtitle">Thoughtfully assembled for your home and life</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link key={col.title} to={col.href} className="group relative overflow-hidden rounded-xl aspect-[4/3] block">
              <img src={col.img} alt={col.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-800/80 via-earth-800/20 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <h3 className="font-serif text-xl font-semibold text-white mb-1">{col.title}</h3>
                <p className="text-cream-300 text-sm">{col.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-cream-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">A simple, transparent process from artisan to your home</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discover', desc: 'Browse thousands of authentic handmade products from verified artisans across India.' },
              { step: '02', title: 'Learn', desc: 'Read each artisan\'s story — where they come from, how they craft, what materials they use.' },
              { step: '03', title: 'Purchase', desc: 'Order securely with Indian payment options. Free shipping above ₹999.' },
              { step: '04', title: 'Cherish', desc: 'Receive your handcrafted piece, carefully packed by the artisan who made it.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-forest-600 text-white flex items-center justify-center font-serif text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-serif text-lg font-semibold text-earth-700 mb-2">{title}</h3>
                <p className="text-sm text-earth-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-cream-200 rounded-2xl p-10 md:p-16 text-center border border-earth-100">
          <h2 className="section-title mb-4">Are you a craftsperson or artisan?</h2>
          <p className="section-subtitle max-w-xl mx-auto mb-8">
            Join KarigarCo. and reach thousands of customers who value authentic, handmade work. Set up your digital storefront in minutes.
          </p>
          <Link to="/become-seller" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
            Become a Seller <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
