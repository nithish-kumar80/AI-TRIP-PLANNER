import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingService } from '../services/bookingService';
import { MapPin, Calendar, Hash, Star, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = ['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

const statusConfig = {
  confirmed: { label: 'Confirmed', cls: 'badge-success' },
  checked_in: { label: 'Checked In', cls: 'badge-info' },
  checked_out: { label: 'Checked Out', cls: 'badge-warning' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
  pending: { label: 'Pending', cls: 'badge-warning' },
};

function CancelModal({ booking, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-2">Cancel Booking</h3>
        <p className="text-slate-400 text-sm mb-4">Are you sure you want to cancel your booking at <strong className="text-white">{booking.hotel?.name}</strong>? Refund will be processed within 5-7 business days.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancellation (optional)" rows={3} className="input-field mb-4 resize-none" />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Keep Booking</button>
          <button onClick={() => onConfirm(reason)} disabled={isPending} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-semibold px-4 py-3 rounded-xl transition-all disabled:opacity-50">
            {isPending ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BookingCard({ booking, onCancel }) {
  const nights = booking.nights || Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000);
  const { label, cls } = statusConfig[booking.status] || { label: booking.status, cls: 'badge-primary' };

  return (
    <motion.div whileHover={{ y: -2 }} className="glass-dark rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={booking.hotel?.coverImage || `https://source.unsplash.com/featured/300x200?hotel`}
            alt={booking.hotel?.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.hotel?.name || 'H')}&size=200&background=1e293b&color=818cf8`; }}
          />
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${cls} badge`}>{label}</span>
              </div>
              <h3 className="text-white font-bold text-lg">{booking.hotel?.name}</h3>
              <div className="flex items-center gap-1 text-slate-400 text-sm mt-0.5">
                <MapPin size={12} />
                <span className="capitalize">{booking.hotel?.city}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary-400 font-black text-xl">₹{booking.finalAmount?.toLocaleString()}</div>
              <div className="text-slate-500 text-xs">Total (incl. GST)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Check In', value: new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Check Out', value: new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Duration', value: `${nights} night${nights > 1 ? 's' : ''}` },
              { label: 'Room', value: booking.room?.name || booking.room?.roomType || 'Standard' },
            ].map((d) => (
              <div key={d.label} className="bg-dark-700/50 p-2.5 rounded-xl">
                <div className="text-slate-500 text-xs">{d.label}</div>
                <div className="text-slate-200 text-sm font-medium mt-0.5">{d.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-slate-500" />
              <span className="text-slate-400 text-xs font-mono">{booking.bookingReference}</span>
            </div>
            {booking.status === 'confirmed' && (
              <button onClick={() => onCancel(booking)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors">
                <X size={14} />Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);

  const queryParams = activeTab !== 'all' ? { status: activeTab } : {};
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', activeTab],
    queryFn: () => bookingService.getMyBookings(queryParams).then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => bookingService.cancelBooking(id, reason),
    onSuccess: () => {
      toast.success('Booking cancelled. Refund in 5-7 days.');
      queryClient.invalidateQueries(['bookings']);
      setCancelTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel.'),
  });

  const bookings = data?.bookings || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">📋 My Bookings</h1>
        <p className="text-slate-400 mt-1">{data?.total || 0} booking{data?.total !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap capitalize transition-all ${activeTab === tab ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-slate-400 hover:text-white hover:bg-dark-800'}`}>
            {tab === 'all' ? 'All Bookings' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)
        ) : bookings.length > 0 ? (
          bookings.map((booking) => <BookingCard key={booking._id} booking={booking} onCancel={setCancelTarget} />)
        ) : (
          <div className="text-center py-20 glass-dark rounded-2xl">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="text-white font-semibold text-lg mb-2">No bookings found</h3>
            <p className="text-slate-400 mb-6">You haven't made any {activeTab !== 'all' ? activeTab : ''} bookings yet.</p>
            <a href="/hotels" className="btn-primary px-6 py-3">Browse Hotels</a>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            booking={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={(reason) => cancelMutation.mutate({ id: cancelTarget._id, reason })}
            isPending={cancelMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
