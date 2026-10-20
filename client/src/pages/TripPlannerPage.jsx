import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plane, MapPin, Users, Calendar, Wallet, Tag, RefreshCw, Save,
  Download, ChevronRight, ChevronLeft, Sparkles, AlertTriangle,
  MessageSquare, ClipboardList, CheckCircle2, Loader2, Send,
  Hotel, ArrowRight, Info, Cloud, Utensils,
} from 'lucide-react';
import { agentService } from '../services/agentService';
import { tripService } from '../services/tripService';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/* ─── Constants ─────────────────────────────────────────────── */
const INTERESTS = [
  'Beach', 'Adventure', 'Culture', 'Food', 'Nature', 'History',
  'Nightlife', 'Shopping', 'Photography', 'Wildlife', 'Trekking', 'Luxury',
];
const TRANSPORT_MODES = [
  { value: 'flight', label: '✈️', name: 'Flight', desc: 'Fast & comfortable' },
  { value: 'train',  label: '🚂', name: 'Train',  desc: 'Scenic & affordable' },
  { value: 'bus',    label: '🚌', name: 'Bus',    desc: 'Budget-friendly' },
  { value: 'car',    label: '🚗', name: 'Car',    desc: 'Flexible' },
  { value: 'mixed',  label: '🔀', name: 'Mixed',  desc: 'Best of all' },
];
const BUDGET_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

const PIPELINE_STAGES = [
  { key: 'intent',     label: 'Understanding intent',      icon: '🧠' },
  { key: 'places',     label: 'Scoring places',            icon: '📍' },
  { key: 'weather',    label: 'Fetching weather',          icon: '🌤' },
  { key: 'events',     label: 'Searching events',          icon: '🎉' },
  { key: 'route',      label: 'Optimizing route',          icon: '🗺' },
  { key: 'cost',       label: 'Estimating costs',          icon: '💰' },
  { key: 'restaurants',label: 'Finding restaurants',       icon: '🍽' },
  { key: 'itinerary',  label: 'Building itinerary',        icon: '📋' },
];

/* ─── Subcomponents ──────────────────────────────────────────── */

function PipelineProgress({ stages }) {
  return (
    <div className="glass-dark rounded-2xl p-6 space-y-3">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Loader2 size={18} className="text-primary-400 animate-spin" />
        AI Agent is working…
      </h3>
      {PIPELINE_STAGES.map((s, i) => {
        const done   = stages && stages[s.key];
        const active = !done && stages && i === Object.keys(stages).length;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300 ${
              done   ? 'bg-emerald-500/20 text-emerald-400'
              : active ? 'bg-primary-500/20 text-primary-400'
              : 'bg-dark-700 text-slate-600'
            }`}>
              {done ? <CheckCircle2 size={14} /> : s.icon}
            </div>
            <span className={`text-sm transition-colors duration-300 ${
              done   ? 'text-emerald-400'
              : active ? 'text-white'
              : 'text-slate-600'
            }`}>
              {s.label}
              {done && stages[s.key] !== true && (
                <span className="text-slate-500 ml-2 text-xs">— {stages[s.key]}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BudgetPieChart({ breakdown }) {
  if (!breakdown) return null;
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: val }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={BUDGET_COLORS[i % BUDGET_COLORS.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => `₹${Number(v).toLocaleString()}`}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ItineraryDay({ day }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass-dark rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-dark-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold text-sm">
            {day.day}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold">{day.title || `Day ${day.day}`}</div>
            {day.date && <div className="text-slate-500 text-xs">{day.date}</div>}
          </div>
        </div>
        <ChevronRight size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-3 border-t border-dark-700">
              {/* Activities */}
              {day.activities?.map((act, i) => (
                <div key={i} className="flex gap-3 pt-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1 flex-shrink-0" />
                    {i < day.activities.length - 1 && <div className="w-0.5 flex-1 bg-dark-600 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {act.time && <span className="text-primary-400 text-xs font-medium">{act.time}</span>}
                        <div className="text-white font-medium text-sm mt-0.5">{act.activity}</div>
                        {act.location && (
                          <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{act.location}
                          </div>
                        )}
                        {act.travelTime && (
                          <div className="text-slate-500 text-xs mt-0.5">🚗 {act.travelTime} min travel</div>
                        )}
                        {act.description && <div className="text-slate-500 text-xs mt-1">{act.description}</div>}
                      </div>
                      {act.estimatedCost > 0 && (
                        <span className="text-emerald-400 text-xs font-medium flex-shrink-0">
                          ₹{act.estimatedCost?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Meals */}
              {day.meals?.length > 0 && (
                <div className="pt-2 border-t border-dark-700">
                  <div className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1">
                    <Utensils size={10} /> MEALS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.meals.map((m, i) => (
                      <div key={i} className="glass px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-slate-300 capitalize">{m.mealType || m.type}</span>
                        {m.name && <span className="text-white font-medium ml-1">{m.name}</span>}
                        {m.cuisine && <span className="text-slate-500 ml-1">· {m.cuisine}</span>}
                        {m.priceRange && <span className="text-slate-500 ml-1">{m.priceRange}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {day.events?.length > 0 && (
                <div className="pt-2 border-t border-dark-700">
                  <div className="text-slate-400 text-xs font-medium mb-2">🎉 EVENTS</div>
                  <div className="space-y-1">
                    {day.events.map((ev, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-center gap-1">
                        <span className="text-amber-400">•</span> {ev.name || ev}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TripPlannerPage() {
  const navigate = useNavigate();

  // UI state machine: idle → generating → generated → confirming → confirmed
  const [uiState, setUiState] = useState('idle'); // 'idle' | 'generating' | 'generated' | 'modifying' | 'confirming' | 'confirmed'
  const [inputMode, setInputMode] = useState('natural'); // 'natural' | 'form'
  const [activeTab, setActiveTab] = useState('overview');

  // Natural language input
  const [nlText, setNlText] = useState('');

  // Form inputs
  const [form, setForm] = useState({
    destination: '',
    budget: 50000,
    travelers: 2,
    duration: 5,
    transportationMode: 'mixed',
  });
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Modification input
  const [modText, setModText] = useState('');

  // Pipeline progress (fake incremental for UX while API is pending)
  const [pipelineStages, setPipelineStages] = useState({});
  const pipelineTimerRef = useRef(null);

  // Results
  const [tripData, setTripData] = useState(null); // { trip, intent, costs, weatherSummary, eventCount, isMockWeather, isMockEvents }
  const [confirmedTrip, setConfirmedTrip] = useState(null);

  /* ─── Helpers ─── */
  const toggleInterest = (interest) =>
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Simulate pipeline progress for UX (actual progress is opaque)
  const startPipelineAnimation = () => {
    const keys = PIPELINE_STAGES.map((s) => s.key);
    let idx = 0;
    const tick = () => {
      if (idx < keys.length) {
        setPipelineStages((prev) => ({ ...prev, [keys[idx]]: true }));
        idx++;
        pipelineTimerRef.current = setTimeout(tick, 1800 + Math.random() * 1200);
      }
    };
    tick();
  };

  const stopPipelineAnimation = () => {
    if (pipelineTimerRef.current) clearTimeout(pipelineTimerRef.current);
    // Mark all done
    const all = {};
    PIPELINE_STAGES.forEach((s) => { all[s.key] = true; });
    setPipelineStages(all);
  };

  /* ─── Mutations ─── */
  const generateMutation = useMutation({
    mutationFn: (payload) => agentService.generate(payload),
    onMutate: () => {
      setUiState('generating');
      setPipelineStages({});
      startPipelineAnimation();
    },
    onSuccess: (res) => {
      stopPipelineAnimation();
      setTripData(res.data.data);
      setUiState('generated');
      setActiveTab('overview');
      toast.success('Itinerary generated!');
    },
    onError: (err) => {
      stopPipelineAnimation();
      setUiState('idle');
      toast.error(err.response?.data?.message || 'Failed to generate itinerary.');
    },
  });

  const modifyMutation = useMutation({
    mutationFn: (payload) => agentService.modify(payload),
    onMutate: () => setUiState('modifying'),
    onSuccess: (res) => {
      setTripData((prev) => ({ ...prev, ...res.data.data }));
      setUiState('generated');
      setModText('');
      toast.success('Trip updated!');
    },
    onError: (err) => {
      setUiState('generated');
      toast.error(err.response?.data?.message || 'Failed to modify trip.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (payload) => agentService.confirm(payload),
    onMutate: () => setUiState('confirming'),
    onSuccess: (res) => {
      setConfirmedTrip(res.data.data.trip);
      setUiState('confirmed');
      toast.success('Trip confirmed!');
    },
    onError: (err) => {
      setUiState('generated');
      toast.error(err.response?.data?.message || 'Failed to confirm trip.');
    },
  });

  /* ─── Event handlers ─── */
  const handleGenerate = () => {
    if (inputMode === 'natural') {
      if (!nlText.trim()) return toast.error('Please describe your trip first.');
      generateMutation.mutate({ userText: nlText.trim() });
    } else {
      if (!form.destination.trim()) return toast.error('Please enter a destination.');
      generateMutation.mutate({
        formData: { ...form, interests: selectedInterests, currency: 'INR' },
      });
    }
  };

  const handleModify = () => {
    if (!modText.trim()) return;
    modifyMutation.mutate({
      tripId: tripData?.trip?._id,
      modificationText: modText.trim(),
      currentIntent: tripData?.intent,
    });
  };

  const handleConfirm = () => {
    if (!tripData?.trip?._id) return;
    confirmMutation.mutate({ tripId: tripData.trip._id });
  };

  const handleDownloadPDF = async () => {
    const tripId = confirmedTrip?._id || tripData?.trip?._id;
    if (!tripId) return;
    try {
      const res = await agentService.downloadPDF(tripId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `VoyageAI-Trip-${tripId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed.');
    }
  };

  const trip = tripData?.trip;
  const intent = tripData?.intent;
  const costs = tripData?.costs;
  const weatherSummary = tripData?.weatherSummary;

  /* ────────────────────────────────────────────────────────────
     RENDER: Generating / Modifying
  ──────────────────────────────────────────────────────────── */
  if (uiState === 'generating') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="text-5xl mb-6"
          >✈️</motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">VoyageAI Agent is planning your trip</h2>
          <p className="text-slate-400 text-sm">Running 8 pipeline stages — about 15–30 seconds</p>
        </div>
        <PipelineProgress stages={pipelineStages} />
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     RENDER: Confirmed (hotel recommendation + PDF)
  ──────────────────────────────────────────────────────────── */
  if (uiState === 'confirmed' && confirmedTrip) {
    const city = confirmedTrip.destination?.split(',')[0]?.toLowerCase() || '';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-xl">Trip Confirmed!</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                <strong className="text-white">{confirmedTrip.title}</strong> has been saved to your trips.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary text-sm flex items-center gap-2 px-4 py-2"
              >
                <Download size={15} /> PDF
              </button>
              <Link
                to={`/trips/${confirmedTrip._id}`}
                className="btn-primary text-sm flex items-center gap-2 px-4 py-2"
              >
                View Trip <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Hotel recommendations */}
        <div className="glass-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Hotel size={20} className="text-primary-400" /> Recommended Hotels
            </h3>
            <Link
              to={`/hotels?city=${encodeURIComponent(city)}`}
              className="text-primary-400 text-sm hover:underline flex items-center gap-1"
            >
              Browse all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Demo disclaimer */}
          <div className="flex items-start gap-3 p-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">
              <strong>Demo Booking</strong> — No real payment or hotel reservation is made.
              This is a portfolio project with simulated booking.
            </p>
          </div>

          {/* Hotel cards from trip's recommendedHotels */}
          {confirmedTrip.recommendedHotels?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {confirmedTrip.recommendedHotels.slice(0, 4).map((h, i) => (
                <div key={i} className="glass rounded-xl p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{h.name}</div>
                      {h.address && (
                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={9} />{h.address}
                        </div>
                      )}
                    </div>
                    {h.pricePerNight > 0 && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-primary-400 font-bold text-sm">₹{h.pricePerNight?.toLocaleString()}</div>
                        <div className="text-slate-600 text-xs">/night</div>
                      </div>
                    )}
                  </div>
                  {h.whyRecommended && (
                    <p className="text-slate-400 text-xs italic mb-3 flex-1">{h.whyRecommended}</p>
                  )}
                  <Link
                    to={`/hotels?city=${encodeURIComponent(city)}&search=${encodeURIComponent(h.name)}`}
                    className="text-center text-xs font-medium py-2 px-3 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
                  >
                    🔍 Find & Book
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Link
              to={`/hotels?city=${encodeURIComponent(city)}`}
              className="btn-primary px-6 py-2 inline-flex items-center gap-2"
            >
              <Hotel size={16} /> Browse Hotels in {confirmedTrip.destination}
            </Link>
          )}
        </div>

        {/* Plan another trip */}
        <div className="text-center">
          <button
            onClick={() => { setUiState('idle'); setTripData(null); setConfirmedTrip(null); setNlText(''); }}
            className="btn-ghost px-6 py-2 text-sm"
          >
            ← Plan Another Trip
          </button>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     RENDER: Generated Itinerary View
  ──────────────────────────────────────────────────────────── */
  if ((uiState === 'generated' || uiState === 'modifying' || uiState === 'confirming') && trip) {
    const tabs = [
      { id: 'overview',   label: 'Overview' },
      { id: 'itinerary',  label: `Day-by-Day (${trip.itinerary?.length || 0}d)` },
      { id: 'restaurants',label: 'Restaurants' },
      { id: 'hotels',     label: 'Hotels' },
      { id: 'budget',     label: 'Budget' },
      { id: 'packing',    label: 'Packing' },
      { id: 'tips',       label: 'Tips' },
    ];

    return (
      <div className="space-y-5">

        {/* ── Top bar ── */}
        <div className="glass-dark rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="badge-primary badge text-xs">🤖 AI Generated</span>
                {weatherSummary?.isMock && (
                  <span className="badge bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
                    ☁️ Simulated Weather
                  </span>
                )}
                {tripData?.isMockEvents && (
                  <span className="badge bg-slate-700 text-slate-400 text-xs">🎉 Demo Events</span>
                )}
              </div>
              <h1 className="text-xl font-black text-white truncate">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MapPin size={11} />{trip.destination}</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{trip.duration} days</span>
                <span className="flex items-center gap-1"><Users size={11} />{trip.travelers} travelers</span>
                <span className="flex items-center gap-1"><Wallet size={11} />₹{trip.budget?.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => { setUiState('idle'); setTripData(null); }}
                className="btn-ghost text-xs px-3 py-2 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> New
              </button>
              <button
                onClick={() => generateMutation.mutate(
                  inputMode === 'natural'
                    ? { userText: nlText }
                    : { formData: { ...form, interests: selectedInterests, currency: 'INR' } }
                )}
                className="btn-ghost text-xs px-3 py-2 flex items-center gap-1"
                disabled={generateMutation.isPending}
              >
                <RefreshCw size={14} /> Regenerate
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending || uiState === 'confirming'}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
              >
                {uiState === 'confirming'
                  ? <><Loader2 size={14} className="animate-spin" /> Confirming…</>
                  : <><CheckCircle2 size={14} /> Confirm Trip</>
                }
              </button>
            </div>
          </div>

          {/* Weather & cost summary row */}
          {(weatherSummary || costs) && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-dark-700">
              {weatherSummary && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Cloud size={13} className="text-blue-400" />
                  <span>
                    ~{weatherSummary.avgTempC}°C avg
                    {weatherSummary.rainyDays > 0 && `, ${weatherSummary.rainyDays} rainy days`}
                    {weatherSummary.isMock && <span className="text-slate-600 ml-1">(simulated)</span>}
                  </span>
                </div>
              )}
              {costs && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Wallet size={13} className="text-emerald-400" />
                  <span>
                    Est. ₹{costs.total?.toLocaleString()}
                    {costs.overBudget && (
                      <span className="text-amber-400 ml-1">⚠ adjusted to fit budget</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modification bar ── */}
        <div className="glass-dark rounded-xl px-4 py-3 flex items-center gap-3">
          <MessageSquare size={15} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={modText}
            onChange={(e) => setModText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleModify()}
            placeholder='Modify this trip… e.g. "Add a day in Nice" or "Replace Day 3 with beach activities"'
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            disabled={uiState === 'modifying'}
          />
          <button
            onClick={handleModify}
            disabled={!modText.trim() || uiState === 'modifying'}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 hover:bg-primary-500/30 transition-colors disabled:opacity-40"
          >
            {uiState === 'modifying' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="glass-dark rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-3">Trip Overview</h2>
                  <p className="text-slate-300 leading-relaxed">{trip.overview}</p>
                </div>

                {trip.highlights?.length > 0 && (
                  <div className="glass-dark rounded-2xl p-6">
                    <h2 className="text-white font-bold text-lg mb-4">✨ Highlights</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {trip.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary-400 mt-0.5">•</span>
                          <span className="text-slate-300 text-sm">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trip.weatherInfo && (
                  <div className="glass-dark rounded-2xl p-6">
                    <h2 className="text-white font-bold text-lg mb-4">
                      🌤 Weather & Climate
                      {weatherSummary?.isMock && (
                        <span className="text-amber-400 text-xs font-normal ml-2">(simulated data)</span>
                      )}
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      {[['Season', trip.weatherInfo.season], ['Avg Temp', trip.weatherInfo.avgTemp], ['Climate', trip.weatherInfo.climate]].map(([k, v]) => (
                        <div key={k} className="glass p-3 rounded-xl text-center">
                          <div className="text-slate-400 text-xs">{k}</div>
                          <div className="text-white font-semibold text-sm mt-1">{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intent debug (collapsed) */}
                {intent && (
                  <details className="glass-dark rounded-xl p-4 text-xs text-slate-500">
                    <summary className="cursor-pointer font-medium text-slate-400 mb-1">
                      🧠 Extracted intent (debug)
                    </summary>
                    <pre className="mt-2 overflow-auto text-slate-600 text-xs">
                      {JSON.stringify(intent, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* DAY-BY-DAY */}
            {activeTab === 'itinerary' && (
              <div className="space-y-3">
                {trip.itinerary?.length > 0
                  ? trip.itinerary.map((day) => <ItineraryDay key={day.day} day={day} />)
                  : <div className="text-center py-12 text-slate-500">No itinerary data.</div>
                }
              </div>
            )}

            {/* RESTAURANTS */}
            {activeTab === 'restaurants' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trip.recommendedRestaurants?.length > 0 ? (
                  trip.recommendedRestaurants.map((r, i) => (
                    <div key={i} className="glass-dark rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-white font-semibold">{r.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{r.cuisine}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {r.rating && <div className="text-amber-400 text-sm">{'★'.repeat(Math.round(r.rating))}</div>}
                          {r.priceRange && <div className="text-slate-500 text-xs">{r.priceRange}</div>}
                        </div>
                      </div>
                      {r.address && (
                        <div className="text-slate-500 text-xs flex items-center gap-1">
                          <MapPin size={9} />{r.address}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-slate-500">No restaurant data.</div>
                )}
              </div>
            )}

            {/* HOTELS */}
            {activeTab === 'hotels' && (
              <div className="space-y-4">
                <div className="glass-dark rounded-xl p-4 flex items-start gap-3 border border-primary-500/20">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <div>
                    <p className="text-slate-300 text-sm font-medium">AI-Recommended Hotels</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      These are AI suggestions. Click <strong className="text-primary-400">Find &amp; Book</strong> to
                      search our hotel database for a demo booking (no real reservation).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip.recommendedHotels?.map((hotel, i) => {
                    const city = trip.destination?.split(',')[0]?.toLowerCase() || '';
                    return (
                      <div key={i} className="glass-dark rounded-2xl p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="text-white font-semibold">{hotel.name}</div>
                            {hotel.address && (
                              <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin size={9} />{hotel.address}
                              </div>
                            )}
                            {hotel.rating && (
                              <div className="flex items-center gap-0.5 mt-1">
                                {[1,2,3,4,5].map((s) => (
                                  <span key={s} className={`text-xs ${s <= Math.round(hotel.rating) ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {hotel.pricePerNight > 0 && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-primary-400 font-bold">₹{hotel.pricePerNight?.toLocaleString()}</div>
                              <div className="text-slate-500 text-xs">/night</div>
                            </div>
                          )}
                        </div>
                        {hotel.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {hotel.amenities.slice(0, 4).map((a) => (
                              <span key={a} className="badge bg-dark-700 text-slate-400 text-xs capitalize">{a}</span>
                            ))}
                          </div>
                        )}
                        {hotel.whyRecommended && (
                          <p className="text-slate-400 text-xs italic mb-3 flex-1">{hotel.whyRecommended}</p>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <Link
                            to={`/hotels?city=${encodeURIComponent(city)}&search=${encodeURIComponent(hotel.name)}`}
                            className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
                          >
                            🔍 Find &amp; Book
                          </Link>
                          <Link
                            to={`/hotels?city=${encodeURIComponent(city)}`}
                            className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-xl bg-dark-700 text-slate-300 border border-dark-600 hover:bg-dark-600 transition-colors"
                          >
                            🏙 View Similar
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {(!trip.recommendedHotels || trip.recommendedHotels.length === 0) && (
                    <div className="col-span-2 text-center py-12 glass-dark rounded-2xl">
                      <div className="text-4xl mb-3">🏨</div>
                      <p className="text-slate-400 mb-4">No hotel suggestions in this itinerary.</p>
                      <Link
                        to={`/hotels?city=${encodeURIComponent(trip.destination?.split(',')[0] || '')}`}
                        className="btn-primary px-6 py-2 inline-block"
                      >
                        Browse Hotels
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BUDGET */}
            {activeTab === 'budget' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-dark rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-4">Budget Breakdown</h2>
                  <BudgetPieChart breakdown={trip.budgetBreakdown} />
                </div>
                <div className="glass-dark rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-4">Category Details</h2>
                  <div className="space-y-3">
                    {trip.budgetBreakdown && Object.entries(trip.budgetBreakdown).map(([key, val], i) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BUDGET_COLORS[i % BUDGET_COLORS.length] }} />
                          <span className="text-slate-300 text-sm capitalize">{key}</span>
                        </div>
                        <span className="text-white font-semibold">₹{val?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-dark-700 pt-3 flex items-center justify-between">
                      <span className="text-white font-bold">Total Budget</span>
                      <span className="text-primary-400 font-black text-lg">₹{trip.budget?.toLocaleString()}</span>
                    </div>
                    {costs?.total && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Estimated Cost</span>
                        <span className={costs.total > trip.budget ? 'text-amber-400' : 'text-emerald-400'}>
                          ₹{costs.total?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PACKING */}
            {activeTab === 'packing' && trip.packingChecklist && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(trip.packingChecklist).map(([cat, items]) => (
                  <div key={cat} className="glass-dark rounded-2xl p-5">
                    <h3 className="text-white font-semibold capitalize mb-3 flex items-center gap-2">
                      {cat === 'clothes' ? '👔' : cat === 'electronics' ? '💻' : cat === 'medicines' ? '💊' : cat === 'documents' ? '📋' : '🎒'}
                      {cat}
                    </h3>
                    <ul className="space-y-2">
                      {items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-slate-500 mt-0.5 flex-shrink-0">☐</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* TIPS */}
            {activeTab === 'tips' && (
              <div className="glass-dark rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-5">💡 Travel Tips</h2>
                <div className="space-y-3">
                  {trip.travelTips?.map((tip, i) => (
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

  /* ────────────────────────────────────────────────────────────
     RENDER: Input Form (idle)
  ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-3xl font-black text-white">VoyageAI Agent</h1>
          <p className="text-slate-400 mt-2 text-sm">
            8-stage AI pipeline: intent → places → weather → events → route → cost → restaurants → itinerary
          </p>
        </div>

        {/* Input mode toggle */}
        <div className="glass-dark rounded-2xl p-1.5 flex gap-1">
          {[
            { id: 'natural', icon: <MessageSquare size={15} />, label: 'Natural Language' },
            { id: 'form',    icon: <ClipboardList size={15} />, label: 'Fill Form' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setInputMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                inputMode === mode.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        {/* ── Natural Language Input ── */}
        {inputMode === 'natural' && (
          <motion.div key="nl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-dark rounded-2xl p-5">
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare size={15} className="text-primary-400" />
                Describe your trip
              </label>
              <textarea
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder={`e.g. "Plan a peaceful 5-day trip to Goa for 2 people with a budget of ₹40,000. I love beaches and seafood."`}
                rows={5}
                className="input-field resize-none w-full"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'Plan a 5-day trip to Goa for ₹40,000',
                  'Family trip to Jaipur, 7 days, ₹1,50,000',
                  'Solo backpacking in Manali for 4 days',
                  '5-day Paris trip, romantic, ₹2,00,000',
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setNlText(ex)}
                    className="text-xs px-3 py-1.5 rounded-full bg-dark-700 text-slate-400 hover:text-white hover:bg-dark-600 transition-colors border border-dark-600"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Form Input ── */}
        {inputMode === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Destination */}
            <div className="glass-dark rounded-2xl p-5">
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MapPin size={15} className="text-primary-400" /> Destination *
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => updateForm('destination', e.target.value)}
                placeholder="e.g. Goa, India or Paris, France"
                className="input-field"
              />
            </div>

            {/* Budget / Duration / Travelers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-dark rounded-2xl p-5">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Wallet size={14} className="text-primary-400" /> Budget (₹)
                </label>
                <div className="text-2xl font-black text-white mb-2">₹{form.budget.toLocaleString()}</div>
                <input
                  type="range"
                  min="5000" max="500000" step="5000"
                  value={form.budget}
                  onChange={(e) => updateForm('budget', parseInt(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1"><span>₹5K</span><span>₹5L</span></div>
              </div>
              <div className="glass-dark rounded-2xl p-5">
                <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-primary-400" /> Duration
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateForm('duration', Math.max(1, form.duration - 1))}
                    className="w-9 h-9 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-lg">-</button>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black text-white">{form.duration}</div>
                    <div className="text-slate-400 text-xs">days</div>
                  </div>
                  <button type="button" onClick={() => updateForm('duration', Math.min(30, form.duration + 1))}
                    className="w-9 h-9 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-lg">+</button>
                </div>
              </div>
              <div className="glass-dark rounded-2xl p-5">
                <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-primary-400" /> Travelers
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateForm('travelers', Math.max(1, form.travelers - 1))}
                    className="w-9 h-9 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-lg">-</button>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black text-white">{form.travelers}</div>
                    <div className="text-slate-400 text-xs">people</div>
                  </div>
                  <button type="button" onClick={() => updateForm('travelers', Math.min(20, form.travelers + 1))}
                    className="w-9 h-9 rounded-xl bg-dark-700 text-white hover:bg-dark-600 transition-colors text-lg">+</button>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="glass-dark rounded-2xl p-5">
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Tag size={14} className="text-primary-400" /> Interests (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50'
                        : 'bg-dark-700 text-slate-400 hover:text-white hover:bg-dark-600 border border-transparent'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Transport mode */}
            <div className="glass-dark rounded-2xl p-5">
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Plane size={14} className="text-primary-400" /> Transportation Mode
              </label>
              <div className="grid grid-cols-5 gap-2">
                {TRANSPORT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateForm('transportationMode', mode.value)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      form.transportationMode === mode.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-xl">{mode.label}</span>
                    <span className="text-xs font-medium text-slate-300 mt-1">{mode.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5 hidden sm:block">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-xs leading-relaxed">
            The agent uses <strong>real cosine-similarity scoring</strong> on seeded places data, Haversine route
            optimization, and deterministic cost estimation. Weather &amp; events use mock data until API keys are added.
            The LLM only <em>explains</em> the structured result — it does not invent facts.
          </p>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          Generate AI Itinerary
        </button>

      </motion.div>
    </div>
  );
}
