import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Users, MapPin, Trash2, Eye, Filter, Plane } from 'lucide-react';
import { tripService } from '../services/tripService';
import toast from 'react-hot-toast';

const statusColors = {
  planned: 'badge-primary',
  active: 'badge-success',
  completed: 'badge-info',
  draft: 'badge-warning',
  cancelled: 'badge-danger',
};

const statusList = ['all', 'planned', 'active', 'completed', 'draft', 'cancelled'];

function TripCard({ trip, onDelete }) {
  const navigate = useNavigate();
  return (
    <motion.div whileHover={{ y: -4 }} className="glass-dark rounded-2xl overflow-hidden group">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary-900 to-dark-800">
        {trip.coverImage ? (
          <img src={trip.coverImage} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">✈️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`${statusColors[trip.status] || 'badge-primary'} badge capitalize`}>{trip.status}</span>
        </div>
        {trip.aiGenerated && (
          <div className="absolute top-3 left-3 bg-primary-500/80 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">🤖 AI</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold text-base mb-1 truncate">{trip.title || trip.destination}</h3>
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
          <MapPin size={11} />
          <span className="truncate">{trip.destination}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-dark-700/50 p-2 rounded-lg text-center">
            <div className="text-white text-sm font-semibold">{trip.duration}</div>
            <div className="text-slate-500 text-xs">days</div>
          </div>
          <div className="bg-dark-700/50 p-2 rounded-lg text-center">
            <div className="text-white text-sm font-semibold">{trip.travelers}</div>
            <div className="text-slate-500 text-xs">travelers</div>
          </div>
          <div className="bg-dark-700/50 p-2 rounded-lg text-center">
            <div className="text-primary-400 text-xs font-bold">₹{trip.budget >= 100000 ? `${(trip.budget / 100000).toFixed(1)}L` : `${(trip.budget / 1000).toFixed(0)}K`}</div>
            <div className="text-slate-500 text-xs">budget</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/trips/${trip._id}`} className="flex-1 btn-primary py-2 text-sm text-center flex items-center justify-center gap-1">
            <Eye size={14} />View
          </Link>
          <button onClick={() => onDelete(trip._id)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyTripsPage() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 12,
    ...(activeStatus !== 'all' && { status: activeStatus }),
    ...(search && { search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['trips', queryParams],
    queryFn: () => tripService.getMyTrips(queryParams).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tripService.deleteTrip(id),
    onSuccess: () => {
      toast.success('Trip deleted.');
      queryClient.invalidateQueries(['trips']);
    },
    onError: () => toast.error('Failed to delete trip.'),
  });

  const trips = data?.trips || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">✈️ My Trips</h1>
          <p className="text-slate-400 mt-1">{data?.total || 0} trip{data?.total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/plan" className="btn-primary inline-flex items-center gap-2 self-start">
          <Plus size={18} />Plan New Trip
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search trips..." className="input-field pl-11" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {statusList.map((s) => (
          <button key={s} onClick={() => { setActiveStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap capitalize transition-all ${activeStatus === s ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-slate-400 hover:text-white hover:bg-dark-800'}`}>
            {s === 'all' ? 'All Trips' : s}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : trips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {trips.map((trip) => (
            <TripCard key={trip._id} trip={trip} onDelete={(id) => {
              if (confirm('Delete this trip?')) deleteMutation.mutate(id);
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-dark rounded-2xl">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-white font-semibold text-xl mb-2">No trips found</h3>
          <p className="text-slate-400 mb-6">Start planning your first adventure!</p>
          <Link to="/plan" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            <Plane size={18} />Plan with AI
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 disabled:opacity-50">← Prev</button>
          <span className="text-slate-400 text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 disabled:opacity-50">Next →</button>
        </div>
      )}
    </div>
  );
}
