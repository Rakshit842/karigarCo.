import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { MapPin, CheckCircle } from 'lucide-react';

export default function ArtisansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sellers', 'all'],
    queryFn: () => api.get('/admin/sellers?status=APPROVED&limit=50').then((r) => r.data.data.sellers),
  });

  // Fallback to public endpoint (admin not needed for public artisan list)
  const { data: publicData } = useQuery({
    queryKey: ['sellers', 'public'],
    queryFn: () => api.get('/sellers/profile/meeras-pottery-studio').then(() =>
      // Build a list from known public slugs (in a real app, there'd be a /sellers public endpoint)
      [{ shopName: "Meera's Pottery Studio", slug: 'meeras-pottery-studio', craftSpecialization: 'Blue Pottery, Ceramics', city: 'Jaipur', state: 'Rajasthan', isVerified: true, logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', description: 'Carrying forward three generations of Jaipur blue pottery tradition.' },
       { shopName: 'Verma Wood Crafts', slug: 'verma-wood-crafts', craftSpecialization: 'Bastar Tribal Woodcraft', city: 'Jagdalpur', state: 'Chhattisgarh', isVerified: true, logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', description: 'Master carver preserving ancient tribal woodcraft traditions of Bastar.' }]
    ),
  });

  const artisans = publicData || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="section-title">Meet Our Artisans</h1>
        <p className="section-subtitle max-w-xl mx-auto">The skilled craftspeople behind every product on KarigarCo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artisans.map((artisan: any) => (
          <div key={artisan.slug} className="card overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 overflow-hidden bg-cream-100">
              <img src={artisan.logoUrl || artisan.coverImageUrl} alt={artisan.shopName} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-serif text-lg font-semibold text-earth-700">{artisan.shopName}</h3>
                {artisan.isVerified && <CheckCircle size={16} className="text-forest-500" />}
              </div>
              {(artisan.city || artisan.state) && (
                <p className="text-xs text-earth-500 flex items-center gap-1 mb-2">
                  <MapPin size={11} />{[artisan.city, artisan.state].filter(Boolean).join(', ')}
                </p>
              )}
              {artisan.craftSpecialization && (
                <p className="text-xs font-medium text-forest-600 mb-3">{artisan.craftSpecialization}</p>
              )}
              {artisan.description && (
                <p className="text-sm text-earth-600 leading-relaxed line-clamp-3 mb-4">{artisan.description}</p>
              )}
              <Link to={`/artisan/${artisan.slug}`} className="btn-secondary text-sm py-2 px-4">
                View Profile
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-16 bg-cream-100 rounded-2xl p-10">
        <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-3">Are you a craftsperson?</h2>
        <p className="text-earth-600 mb-6">Join KarigarCo. and reach thousands of customers who value authentic, handmade work.</p>
        <Link to="/become-seller" className="btn-primary inline-block">Become a Seller</Link>
      </div>
    </div>
  );
}
