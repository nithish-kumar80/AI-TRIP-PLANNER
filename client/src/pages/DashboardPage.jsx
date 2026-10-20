import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Hotel, MessageSquare, TrendingUp, MapPin, Calendar, Users, DollarSign, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/aiService';

const statConfig = [
  { key: 'totalTrips', label: 'Total Trips', icon: Plane, color: 'from-violet-500 to-purple-600', suffix: '' },
  { key: 'totalSpent', label: 'Total Spent', icon: DollarSign, color: 'from-emerald-500 to-teal-600', prefix: '₹', format: true },
  { key: 'totalBookings', label: 'Bookings', icon: Hotel, color: 'from-blue-500 to-cyan-600', suffix: '' },
  { key: 'profileCompletion', label: 'Profile', icon: TrendingUp, color: 'from-orange-500 to-amber-600', suffix: '%' },
];

const quickActions = [
  { to: '/plan', icon: Plane, label: 'Plan AI Trip', desc: 'Generate personalized itinerary', color: 'from-violet-500 to-purple-600' },
  { to: '/hotels', icon: Hotel, label: 'Browse Hotels', desc: 'Find & book accommodation', color: 'from-blue-500 to-cyan-600' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat', desc: 'Talk to your travel assistant', color: 'from-emerald-500 to-teal-600' },
];

const statusColors = {
  planned: 'badge-primary',
  active: 'badge-success',
  completed: 'badge-info',
  draft: 'badge-warning',
  cancelled: 'badge-danger',
};

const bookingStatusColors = {
  confirmed: 'badge-success',
  cancelled: 'badge-danger',
  checked_in: 'badge-info',
  checked_out: 'badge-warning',
};

function SkeletonStat() {
  return <div className="card h-28 skeleton" />;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userService.getDashboard().then((r) => r.data.data),
  });

  const stats = data?.stats || {};
  const upcomingTrips = data?.upcomingTrips || [];
  const recentBookings = data?.recentBookings || [];

  const formatCurrency = (val) =>
    val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your travel overview</p>
        </div>
        <Link to="/plan" className="btn-primary inline-flex items-center gap-2 self-start">
          <Plus size={18} />
          New Trip
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-dark p-5 rounded-2xl relative overflow-hidden"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-8 w-24 rounded" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <div className="text-2xl font-black text-white">
                  {s.prefix || ''}{s.format ? formatCurrency(stats[s.key] || 0) : (stats[s.key] || 0)}{s.suffix}
                </div>
                <div className="text-slate-400 text-sm mt-1">{s.label}</div>
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-5 pointer-events-none`} />
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <Link to={action.to} className="glass-dark p-5 rounded-2xl flex items-center gap-4 hover:border-primary-500/40 transition-all duration-300 group block">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">{action.label}</div>
                  <div className="text-slate-400 text-sm truncate">{action.desc}</div>
                </div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Upcoming Trips</h2>
            <Link to="/trips" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <Link key={trip._id} to={`/trips/${trip._id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-700/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-lg flex-shrink-0">
                    ✈️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{trip.title || trip.destination}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-400 text-xs flex items-center gap-1"><MapPin size={10} />{trip.destination}</span>
                      <span className="text-slate-500 text-xs flex items-center gap-1"><Users size={10} />{trip.travelers}</span>
                    </div>
                  </div>
                  <span className={`${statusColors[trip.status] || 'badge-primary'} badge flex-shrink-0`}>{trip.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-slate-400 text-sm mb-4">No upcoming trips</p>
              <Link to="/plan" className="btn-primary text-sm px-4 py-2">Plan a Trip</Link>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
            <Link to="/bookings" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.slice(0, 3).map((booking) => (
                <div key={booking._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-700/50 transition-colors">
                  <img
                    src={booking.hotel?.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.hotel?.name || 'H')}&background=1e293b&color=818cf8`}
                    alt={booking.hotel?.name}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{booking.hotel?.name}</div>
                    <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{booking.hotel?.city}
                    </div>
                  </div>
                  <span className={`${bookingStatusColors[booking.status] || 'badge-primary'} badge flex-shrink-0`}>{booking.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏨</div>
              <p className="text-slate-400 text-sm mb-4">No bookings yet</p>
              <Link to="/hotels" className="btn-primary text-sm px-4 py-2">Browse Hotels</Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion Banner */}
      {user && (user.profileCompletion || 0) < 80 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="gradient-border bg-dark-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold">Complete your profile</h3>
            <p className="text-slate-400 text-sm mt-1">A complete profile helps us personalize your travel recommendations.</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-dark-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-700" style={{ width: `${user.profileCompletion || 0}%` }} />
              </div>
              <span className="text-primary-400 text-sm font-bold">{user.profileCompletion || 0}%</span>
            </div>
          </div>
          <Link to="/profile" className="btn-primary text-sm px-5 py-2.5 flex-shrink-0">Complete Profile</Link>
        </motion.div>
      )}
    </div>
  );
}
