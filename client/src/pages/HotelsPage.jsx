import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Heart, Wifi, Waves, Dumbbell, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { userService } from '../services/aiService';
import toast from 'react-hot-toast';

const amenityIcons = { wifi: '📶', pool: '🏊', gym: '💪', spa: '💆', restaurant: '🍽️', bar: '🍸', parking: '🅿️', airconditioning: '❄️', room_service: '🛎️' };
const hotelTypes = ['All', 'hotel', 'resort', 'boutique', 'hostel', 'villa', 'apartment'];
const sortOptions = [
  { value: 'averageRating:-1', label: 'Top Rated' },
  { value: 'pricePerNight:1', label: 'Price: Low to High' },
  { value: 'pricePerNight:-1', label: 'Price: High to Low' },
  { value: 'createdAt:-1', label: 'Newest' },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
      ))}
      <span className="text-slate-400 text-xs ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

function HotelCard({ hotel, onToggleFavorite, favorites }) {
  const isFav = favorites?.some((f) => f.hotel?._id === hotel._id);
  return (
    <motion.div whileHover={{ y: -4 }} className="glass-dark rounded-2xl overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.coverImage || `https://source.unsplash.com/featured/400x300?hotel,${hotel.city}`}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hotel.name)}&size=400&background=1e293b&color=6366f1`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => onToggleFavorite(hotel)}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isFav ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-red-500/60'}`}
        >
          <Heart size={16} className={isFav ? 'fill-white' : ''} />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="badge bg-black/50 text-white border-0 backdrop-blur-sm capitalize">{hotel.hotelType}</span>
        </div>
        <div className="absolute top-3 left-3">
          {'⭐'.repeat(hotel.starRating)}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white font-semibold text-sm leading-tight">{hotel.name}</h3>
          <div className="text-right flex-shrink-0">
            <div className="text-primary-400 font-bold">₹{hotel.pricePerNight?.toLocaleString()}</div>
            <div className="text-slate-500 text-xs">/night</div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <MapPin size={12} className="text-slate-500" />
          <span className="text-slate-400 text-xs capitalize">{hotel.city}, {hotel.country}</span>
        </div>

        <StarRating rating={hotel.averageRating} />
        <div className="text-slate-500 text-xs mt-0.5">{hotel.reviewCount?.toLocaleString()} reviews</div>

        {hotel.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {hotel.amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-xs bg-dark-700 text-slate-400 px-2 py-0.5 rounded-md">
                {amenityIcons[a] || '✓'} {a.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <Link to={`/hotels/${hotel._id}`} className="btn-primary w-full mt-4 py-2.5 text-sm text-center block">
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

function SkeletonHotelCard() {
  return (
    <div className="glass-dark rounded-2xl overflow-hidden">
      <div className="skeleton h-48" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function HotelsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ city: '', minPrice: '', maxPrice: '', rating: '', hotelType: '', sort: 'averageRating:-1', page: 1 });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = { ...filters, search };

  const { data, isLoading } = useQuery({
    queryKey: ['hotels', queryParams],
    queryFn: () => hotelService.searchHotels(queryParams).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userService.getFavorites().then((r) => r.data.data.favorites),
  });

  const favMutation = useMutation({
    mutationFn: ({ hotel, isFav, favId }) =>
      isFav ? userService.removeFavorite(favId) : userService.addFavorite({ itemType: 'hotel', hotelId: hotel._id }),
    onSuccess: () => queryClient.invalidateQueries(['favorites']),
  });

  const handleToggleFavorite = (hotel) => {
    const existing = favData?.find((f) => f.hotel?._id === hotel._id);
    favMutation.mutate({ hotel, isFav: !!existing, favId: existing?._id });
    toast.success(existing ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  const hotels = data?.hotels || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">🏨 Hotels</h1>
        <p className="text-slate-400 mt-1">{data?.total || 0} properties found</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFilters((p) => ({ ...p, page: 1 })); }}
            placeholder="Search hotels, cities..."
            className="input-field pl-11"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-primary-500/50 text-primary-400' : ''}`}>
          <SlidersHorizontal size={16} />
          Filters
        </button>
        <select value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value, page: 1 }))} className="input-field w-auto">
          {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">City</label>
            <input value={filters.city} onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value, page: 1 }))} placeholder="Mumbai, Goa..." className="input-field text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Min Price (₹)</label>
            <input type="number" value={filters.minPrice} onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value, page: 1 }))} placeholder="0" className="input-field text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Max Price (₹)</label>
            <input type="number" value={filters.maxPrice} onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value, page: 1 }))} placeholder="100000" className="input-field text-sm py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Min Rating</label>
            <select value={filters.rating} onChange={(e) => setFilters((p) => ({ ...p, rating: e.target.value, page: 1 }))} className="input-field text-sm py-2">
              <option value="">Any</option>
              {[3, 3.5, 4, 4.5].map((r) => <option key={r} value={r}>{r}+ stars</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className="block text-xs text-slate-400 mb-2">Hotel Type</label>
            <div className="flex flex-wrap gap-2">
              {hotelTypes.map((t) => (
                <button key={t} onClick={() => setFilters((p) => ({ ...p, hotelType: t === 'All' ? '' : t, page: 1 }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(t === 'All' ? !filters.hotelType : filters.hotelType === t) ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <SkeletonHotelCard key={i} />)
        ) : hotels.length > 0 ? (
          hotels.map((hotel) => (
            <HotelCard key={hotel._id} hotel={hotel} onToggleFavorite={handleToggleFavorite} favorites={favData || []} />
          ))
        ) : (
          <div className="col-span-3 text-center py-20">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="text-white font-semibold text-lg mb-2">No hotels found</h3>
            <p className="text-slate-400">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} disabled={filters.page === 1} className="btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-50">
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-slate-400 text-sm">Page {filters.page} of {totalPages}</span>
          <button onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} disabled={filters.page === totalPages} className="btn-secondary px-4 py-2 flex items-center gap-2 disabled:opacity-50">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
