import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Wifi, Waves, Dumbbell, ArrowLeft, Calendar, Users, Wallet, ChevronLeft, ChevronRight, Heart, CheckCircle, Loader2, AlertTriangle, X } from 'lucide-react';
import { hotelService } from '../services/hotelService';
import { bookingService } from '../services/bookingService';
import { userService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const amenityIcons = {
  wifi: { icon: '📶', label: 'Free WiFi' }, pool: { icon: '🏊', label: 'Swimming Pool' }, gym: { icon: '💪', label: 'Fitness Center' },
  spa: { icon: '💆', label: 'Spa' }, restaurant: { icon: '🍽️', label: 'Restaurant' }, bar: { icon: '🍸', label: 'Bar' },
  parking: { icon: '🅿️', label: 'Free Parking' }, airconditioning: { icon: '❄️', label: 'Air Conditioning' },
  room_service: { icon: '🛎️', label: 'Room Service' }, conference: { icon: '🏢', label: 'Conference' },
  pet_friendly: { icon: '🐾', label: 'Pet Friendly' }, beach_access: { icon: '🏖️', label: 'Beach Access' },
  airport_shuttle: { icon: '🚌', label: 'Airport Shuttle' }, laundry: { icon: '👕', label: 'Laundry' },
  concierge: { icon: '🎩', label: 'Concierge' }, business_center: { icon: '💼', label: 'Business Center' },
};

function BookingModal({ hotel, rooms, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    roomId: rooms[0]?._id || '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    paymentMethod: 'card',
    specialRequests: '',
    // Guest details — pre-filled from logged-in user
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: '',
  });

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0;

  const selectedRoom = rooms.find((r) => r._id === form.roomId);
  const subtotal = (selectedRoom?.pricePerNight || 0) * nights;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const bookMutation = useMutation({
    mutationFn: () => bookingService.createBooking({
      hotelId: hotel._id,
      roomId: form.roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: { adults: form.adults, children: form.children },
      paymentMethod: form.paymentMethod,
      specialRequests: form.specialRequests,
      guestDetails: {
        name: form.guestName,
        email: form.guestEmail,
        phone: form.guestPhone,
      },
    }),
    onSuccess: (res) => {
      const ref = res.data?.data?.booking?.bookingReference || '';
      toast.success(`Booking confirmed! ${ref ? `Ref: ${ref}` : '🎉'}`);
      queryClient.invalidateQueries(['bookings']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Booking failed.'),
  });

  const today = new Date().toISOString().split('T')[0];
  const isValid = form.checkIn && form.checkOut && form.roomId && nights > 0
    && form.guestName.trim() && form.guestEmail.trim() && form.guestPhone.trim();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h3 className="text-white font-bold text-lg">Book {hotel.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Guest Details */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Guest Information</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.guestName}
                  onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.guestEmail}
                    onChange={(e) => setForm((p) => ({ ...p, guestEmail: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone <span className="text-red-400">*</span></label>
                  <input
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={form.guestPhone}
                    onChange={(e) => setForm((p) => ({ ...p, guestPhone: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Room Type</label>
            <select value={form.roomId} onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))} className="input-field">
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} ({room.roomType}) — ₹{room.pricePerNight?.toLocaleString()}/night ({room.availableRooms} available)
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Check In</label>
              <input type="date" min={today} value={form.checkIn} onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Check Out</label>
              <input type="date" min={form.checkIn || today} value={form.checkOut} onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))} className="input-field" />
            </div>
          </div>

          {/* Guests */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Adults</label>
              <select value={form.adults} onChange={(e) => setForm((p) => ({ ...p, adults: parseInt(e.target.value) }))} className="input-field">
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Children</label>
              <select value={form.children} onChange={(e) => setForm((p) => ({ ...p, children: parseInt(e.target.value) }))} className="input-field">
                {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} child{n !== 1 ? 'ren' : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Special Requests (optional)</label>
            <textarea value={form.specialRequests} onChange={(e) => setForm((p) => ({ ...p, specialRequests: e.target.value }))} rows={2} className="input-field resize-none" placeholder="Early check-in, room on higher floor..." />
          </div>

          {/* Price Summary */}
          {nights > 0 && (
            <div className="bg-dark-700/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">₹{selectedRoom?.pricePerNight?.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span className="text-slate-300">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Taxes & GST (12%)</span>
                <span className="text-slate-300">₹{taxes.toLocaleString()}</span>
              </div>
              <div className="border-t border-dark-600 pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary-400 text-lg">₹{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Simulated booking notice */}
          <p className="text-center text-slate-600 text-xs">🔒 This is a simulated booking for demo purposes. No real reservation is made.</p>
        </div>

        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => bookMutation.mutate()}
            disabled={!isValid || bookMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {bookMutation.isPending ? <><Loader2 size={16} className="animate-spin" />Booking...</> : 'Confirm Booking'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => hotelService.getHotelById(id).then((r) => r.data.data),
  });

  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userService.getFavorites().then((r) => r.data.data.favorites),
  });

  const favMutation = useMutation({
    mutationFn: ({ isFav, favId }) =>
      isFav ? userService.removeFavorite(favId) : userService.addFavorite({ itemType: 'hotel', hotelId: id }),
    onSuccess: () => queryClient.invalidateQueries(['favorites']),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4"><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-40 rounded-2xl" /></div>
      </div>
    );
  }

  const hotel = data?.hotel || data;
  const rooms = data?.rooms || [];

  if (!hotel) return (
    <div className="text-center py-20">
      <h2 className="text-white text-xl font-bold mb-2">Hotel not found</h2>
      <Link to="/hotels" className="btn-primary px-6 py-3">Back to Hotels</Link>
    </div>
  );

  const images = hotel.images?.length > 0 ? hotel.images : [hotel.coverImage || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80`];
  const isFav = favData?.some((f) => f.hotel?._id === hotel._id);
  const favItem = favData?.find((f) => f.hotel?._id === hotel._id);

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={18} />Back to Hotels
      </button>

      {/* Image Gallery */}
      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden bg-dark-800">
        <img src={images[currentImage]} alt={hotel.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hotel.name)}&size=800&background=1e293b&color=6366f1`; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {images.length > 1 && (
          <>
            <button onClick={() => setCurrentImage((p) => Math.max(0, p - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
              <ChevronLeft size={18} className="text-white" />
            </button>
            <button onClick={() => setCurrentImage((p) => Math.min(images.length - 1, p + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
              <ChevronRight size={18} className="text-white" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-white' : 'bg-white/40'}`} />)}
            </div>
          </>
        )}

        <button onClick={() => { favMutation.mutate({ isFav, favId: favItem?._id }); toast.success(isFav ? 'Removed from wishlist' : 'Added to wishlist ❤️'); }} className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isFav ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white hover:bg-red-500/60'}`}>
          <Heart size={18} className={isFav ? 'fill-white' : ''} />
        </button>
      </div>

      {/* Hotel Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{'⭐'.repeat(hotel.starRating || 3)}</span>
            <span className="badge bg-dark-700 text-slate-300 capitalize">{hotel.hotelType}</span>
          </div>
          <h1 className="text-2xl font-black text-white">{hotel.name}</h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
            <MapPin size={14} />
            <span>{hotel.address}</span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= Math.round(hotel.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />)}
              <span className="text-white font-semibold ml-1">{hotel.averageRating?.toFixed(1)}</span>
            </div>
            <span className="text-slate-400 text-sm">({hotel.reviewCount?.toLocaleString()} reviews)</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-3xl font-black text-primary-400">₹{hotel.pricePerNight?.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">per night</div>
          </div>
          <button onClick={() => setShowBooking(true)} className="btn-primary px-6 py-3">Book Now</button>
        </div>
      </div>

      {/* Description */}
      {hotel.description && (
        <div className="glass-dark rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-3">About this property</h2>
          <p className="text-slate-300 leading-relaxed">{hotel.description}</p>
        </div>
      )}

      {/* Amenities */}
      {hotel.amenities?.length > 0 && (
        <div className="glass-dark rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Amenities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {hotel.amenities.map((a) => {
              const info = amenityIcons[a] || { icon: '✓', label: a.replace(/_/g, ' ') };
              return (
                <div key={a} className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-xl">
                  <span className="text-xl">{info.icon}</span>
                  <span className="text-slate-300 text-sm capitalize">{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Rooms */}
      {rooms.length > 0 && (
        <div className="glass-dark rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Available Rooms</h2>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700/50 rounded-xl">
                <div>
                  <div className="text-white font-semibold">{room.name}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-slate-400 text-xs capitalize">{room.bedType} bed</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-xs">Max {room.maxOccupancy} guests</span>
                    {room.view && room.view !== 'none' && <><span className="text-slate-500">•</span><span className="text-slate-400 text-xs capitalize">{room.view} view</span></>}
                    {room.size && <><span className="text-slate-500">•</span><span className="text-slate-400 text-xs">{room.size} sq ft</span></>}
                  </div>
                  <div className="text-emerald-400 text-xs mt-1">{room.availableRooms} rooms available</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-primary-400 font-bold">₹{room.pricePerNight?.toLocaleString()}</div>
                    <div className="text-slate-500 text-xs">/night</div>
                  </div>
                  <button onClick={() => setShowBooking(true)} className="btn-primary text-sm px-4 py-2">Select</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="glass-dark rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Hotel Policies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Check In', value: hotel.checkInTime || '14:00' },
            { label: 'Check Out', value: hotel.checkOutTime || '12:00' },
            { label: 'Min Age', value: `${hotel.policies?.ageRestriction || 18}+` },
            { label: 'Smoking', value: hotel.policies?.smokingPolicy || 'Non-smoking' },
          ].map((p) => (
            <div key={p.label} className="bg-dark-700/50 p-3 rounded-xl text-center">
              <div className="text-slate-400 text-xs">{p.label}</div>
              <div className="text-white font-medium text-sm mt-1">{p.value}</div>
            </div>
          ))}
        </div>
        {hotel.policies?.cancellationPolicy && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-300 text-sm">{hotel.policies.cancellationPolicy}</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && rooms.length > 0 && (
          <BookingModal hotel={hotel} rooms={rooms} onClose={() => setShowBooking(false)} />
        )}
        {showBooking && rooms.length === 0 && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-800 border border-dark-700 rounded-2xl p-8 w-full max-w-sm text-center">
              <div className="text-5xl mb-4">🏨</div>
              <h3 className="text-white font-bold text-lg mb-2">No Rooms Available</h3>
              <p className="text-slate-400 text-sm mb-6">Room inventory for this hotel hasn't been loaded yet.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowBooking(false)} className="btn-secondary flex-1">Close</button>
                <a href="/hotels" className="btn-primary flex-1 text-center">Browse Hotels</a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
