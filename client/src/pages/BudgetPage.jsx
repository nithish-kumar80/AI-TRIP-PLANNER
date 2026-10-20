import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PieChart, AlertCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { aiService } from '../services/aiService';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function BudgetPage() {
  const { user } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState('');
  const [budgetInput, setBudgetInput] = useState({ destination: '', budget: 50000, travelers: 2, duration: 5, currency: 'INR' });
  const [budgetData, setBudgetData] = useState(null);

  const { data: tripsData } = useQuery({
    queryKey: ['trips-budget'],
    queryFn: () => tripService.getMyTrips({ limit: 50 }).then((r) => r.data.data.trips),
  });

  const trips = tripsData || [];
  const selectedTripData = trips.find((t) => t._id === selectedTrip);

  const budgetMutation = useMutation({
    mutationFn: (data) => aiService.generateBudget(data),
    onSuccess: (res) => {
      setBudgetData(res.data.data.budgetPlan);
      toast.success('Budget generated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate budget.'),
  });

  const displayBreakdown = selectedTripData?.budgetBreakdown || budgetData?.breakdown;
  const displayTotal = selectedTripData?.budget || budgetData?.total || 0;

  const pieData = displayBreakdown
    ? Object.entries(displayBreakdown).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: val,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">💰 Budget Planner</h1>
        <p className="text-slate-400 mt-1">Analyze and optimize your travel spending</p>
      </div>

      {/* Trip Selector */}
      <div className="glass-dark rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">View Trip Budget</h2>
        {trips.length > 0 ? (
          <div className="flex gap-3 flex-wrap">
            <select value={selectedTrip} onChange={(e) => setSelectedTrip(e.target.value)} className="input-field flex-1 min-w-48">
              <option value="">Select a trip to analyze...</option>
              {trips.map((t) => (
                <option key={t._id} value={t._id}>{t.title || t.destination} ({t.duration} days)</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No trips found. Plan a trip first to analyze its budget.</p>
        )}
      </div>

      {/* Budget Display from selected trip */}
      {selectedTripData?.budgetBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-dark rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">{selectedTripData.title}</h2>
            <p className="text-slate-400 text-sm mb-4">{selectedTripData.destination} • {selectedTripData.duration} days • {selectedTripData.travelers} travelers</p>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="glass-dark rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Category Breakdown</h2>
            <div className="space-y-3">
              {pieData.map((item, i) => {
                const pct = Math.round((item.value / displayTotal) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-300 text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold text-sm">₹{item.value?.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs ml-2">{pct}%</span>
                      </div>
                    </div>
                    <div className="bg-dark-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-dark-700 pt-3 flex items-center justify-between">
                <span className="text-white font-bold">Total Budget</span>
                <span className="text-primary-400 font-black text-xl">₹{displayTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Budget Generator */}
      <div className="glass-dark rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-primary-400" />Generate AI Budget</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Destination</label>
            <input value={budgetInput.destination} onChange={(e) => setBudgetInput((p) => ({ ...p, destination: e.target.value }))} placeholder="e.g. Goa, India" className="input-field text-sm py-2.5" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Total Budget (₹)</label>
            <input type="number" value={budgetInput.budget} onChange={(e) => setBudgetInput((p) => ({ ...p, budget: parseInt(e.target.value) || 0 }))} className="input-field text-sm py-2.5" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Duration (days)</label>
            <input type="number" value={budgetInput.duration} min={1} max={30} onChange={(e) => setBudgetInput((p) => ({ ...p, duration: parseInt(e.target.value) || 1 }))} className="input-field text-sm py-2.5" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Travelers</label>
            <input type="number" value={budgetInput.travelers} min={1} max={20} onChange={(e) => setBudgetInput((p) => ({ ...p, travelers: parseInt(e.target.value) || 1 }))} className="input-field text-sm py-2.5" />
          </div>
        </div>
        <button onClick={() => budgetMutation.mutate(budgetInput)} disabled={!budgetInput.destination || budgetMutation.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {budgetMutation.isPending ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Generate Budget Plan</>}
        </button>
      </div>

      {/* AI Budget Result */}
      {budgetData && (
        <div className="glass-dark rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">{budgetData.title || 'AI Budget Plan'}</h2>
          {budgetData.breakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie data={Object.entries(budgetData.breakdown).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                    {Object.keys(budgetData.breakdown).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(budgetData.breakdown).map(([key, val], i) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-300 text-sm capitalize">{key}</span>
                    </div>
                    <span className="text-white font-semibold">₹{val?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-dark-700 pt-3 flex justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-primary-400 font-black text-lg">₹{budgetData.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          {budgetData.tips?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-white font-semibold mb-3">💡 Budget Tips</h3>
              <ul className="space-y-2">
                {budgetData.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-primary-400 mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tips if no data */}
      {!selectedTripData?.budgetBreakdown && !budgetData && (
        <div className="glass-dark rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">💡 Budget Tips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Book Early', desc: 'Book hotels 2-3 weeks in advance to save 15-30% on rates.' },
              { title: 'Travel Off-Season', desc: 'Avoid peak seasons to get better deals and fewer crowds.' },
              { title: 'Use Local Transport', desc: 'Local buses and trains can save significantly vs taxis.' },
              { title: 'Set Daily Limits', desc: 'Divide your budget by number of days for daily spending limits.' },
              { title: 'Emergency Fund', desc: 'Always keep 10-15% of budget as emergency reserve.' },
              { title: 'Pre-book Attractions', desc: 'Many attractions offer discounts for online pre-booking.' },
            ].map((tip) => (
              <div key={tip.title} className="p-4 bg-dark-700/50 rounded-xl">
                <h4 className="text-white font-medium text-sm mb-1">{tip.title}</h4>
                <p className="text-slate-400 text-xs">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
