import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { MapPin, Calendar, Users, Wallet, Star, Hotel, ArrowLeft, RefreshCw, Save, Download, Trash2, Map, ChevronRight, Globe } from 'lucide-react';
import { tripService } from '../services/tripService';
import { agentService } from '../services/agentService';
import toast from 'react-hot-toast';

const statusColors = { planned: 'badge-primary', active: 'badge-success', completed: 'badge-info', draft: 'badge-warning', cancelled: 'badge-danger' };

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripService.getTripById(id).then((r) => r.data.data.trip),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tripService.deleteTrip(id),
    onSuccess: () => {
      toast.success('Trip deleted.');
      navigate('/trips');
    },
    onError: () => toast.error('Failed to delete.'),
  });

  const saveMutation = useMutation({
    mutationFn: () => tripService.updateTrip(id, { isSaved: true }),
    onSuccess: () => {
      toast.success('Trip saved!');
      queryClient.invalidateQueries(['trip', id]);
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const res = await agentService.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `VoyageAI-Trip-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('PDF download failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const trip = data;
  if (!trip) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-white text-xl font-bold mb-2">Trip not found</h2>
      <Link to="/trips" className="btn-primary px-6 py-3">Back to My Trips</Link>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: `Itinerary (${trip.itinerary?.length || 0} days)` },
    { id: 'hotels', label: 'Hotels' },
    { id: 'packing', label: 'Packing' },
    { id: 'tips', label: 'Tips' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center hover:bg-dark-700 transition-colors">
          <ArrowLeft size={18} className="text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${statusColors[trip.status] || 'badge-primary'} badge capitalize`}>{trip.status}</span>
            {trip.aiGenerated && <span className="badge-primary badge">🤖 AI Generated</span>}
          </div>
          <h1 className="text-2xl font-black text-white truncate">{trip.title || trip.destination}</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!trip.isSaved && (
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
              <Save size={14} />{saveMutation.isPending ? '...' : 'Save'}
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            className="p-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-colors"
            title="Download PDF"
          >
            <Download size={16} />
          </button>
          <button onClick={() => { if (confirm('Delete this trip?')) deleteMutation.mutate(); }} className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Trip Info Banner */}
      <div className="glass-dark rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <MapPin size={18} className="text-primary-400" />
            </div>
            <div>
              <div className="text-slate-400 text-xs">Destination</div>
              <div className="text-white font-semibold text-sm">{trip.destination}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Calendar size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-slate-400 text-xs">Duration</div>
              <div className="text-white font-semibold text-sm">{trip.duration} days</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-slate-400 text-xs">Travelers</div>
              <div className="text-white font-semibold text-sm">{trip.travelers}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Wallet size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-slate-400 text-xs">Budget</div>
              <div className="text-primary-400 font-bold text-sm">₹{trip.budget?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-slate-400 hover:text-white hover:bg-dark-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {trip.overview && (
                <div className="glass-dark rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
                  <p className="text-slate-300 leading-relaxed">{trip.overview}</p>
                </div>
              )}
              {trip.highlights?.length > 0 && (
                <div className="glass-dark rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-white mb-3">✨ Highlights</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trip.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary-400 mt-0.5">•</span>
                        <span className="text-slate-300 text-sm">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {trip.interests?.length > 0 && (
                <div className="glass-dark rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-white mb-3">Interests</h2>
                  <div className="flex flex-wrap gap-2">
                    {trip.interests.map((interest) => (
                      <span key={interest} className="badge-primary badge">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div className="space-y-3">
              {trip.itinerary?.length > 0 ? trip.itinerary.map((day) => (
                <div key={day.day} className="glass-dark rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold text-sm">{day.day}</div>
                    <div>
                      <div className="text-white font-semibold">{day.title || `Day ${day.day}`}</div>
                      {day.date && <div className="text-slate-500 text-xs">{day.date}</div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {day.activities?.map((act, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-dark-700/50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {act.time && <div className="text-primary-400 text-xs font-medium">{act.time}</div>}
                          <div className="text-white text-sm font-medium">{act.activity}</div>
                          {act.location && <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10} />{act.location}</div>}
                        </div>
                        {act.estimatedCost > 0 && <span className="text-emerald-400 text-xs font-medium flex-shrink-0">₹{act.estimatedCost?.toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400">No itinerary available for this trip.</div>
              )}
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              {trip.recommendedHotels?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trip.recommendedHotels.map((hotel, i) => (
                    <div key={i} className="glass-dark rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold">{hotel.name}</h3>
                        <div className="text-right flex-shrink-0">
                          <div className="text-primary-400 font-bold text-sm">₹{hotel.pricePerNight?.toLocaleString()}</div>
                          <div className="text-slate-500 text-xs">/night</div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs flex items-center gap-1 mb-2"><MapPin size={10} />{hotel.address}</p>
                      <p className="text-slate-400 text-xs italic">{hotel.whyRecommended}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">No hotel recommendations for this trip.</div>
              )}
            </div>
          )}

          {activeTab === 'packing' && trip.packingChecklist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(trip.packingChecklist).map(([cat, items]) => (
                <div key={cat} className="glass-dark rounded-2xl p-5">
                  <h3 className="text-white font-semibold capitalize mb-3">
                    {cat === 'clothes' ? '👔' : cat === 'electronics' ? '💻' : cat === 'medicines' ? '💊' : cat === 'documents' ? '📋' : '🎒'} {cat}
                  </h3>
                  <ul className="space-y-1.5">
                    {items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-slate-600 mt-0.5">☐</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && trip.travelTips?.length > 0 && (
            <div className="glass-dark rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">💡 Travel Tips</h2>
              <div className="space-y-3">
                {trip.travelTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-dark-700/50 rounded-xl">
                    <span className="text-primary-400 font-bold text-sm flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-slate-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
