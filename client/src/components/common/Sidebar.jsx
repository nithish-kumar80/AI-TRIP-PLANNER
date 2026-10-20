import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map, Plane, Hotel, BookOpen, MessageSquare, Wallet, User, X, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plan', icon: Plane, label: 'Plan Trip', badge: 'AI' },
  { to: '/trips', icon: Globe, label: 'My Trips' },
  { to: '/hotels', icon: Hotel, label: 'Hotels' },
  { to: '/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat', badge: 'AI' },
  { to: '/budget', icon: Wallet, label: 'Budget' },
  { to: '/map', icon: Map, label: 'Map View' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <span className="text-xl font-black gradient-text">✈️ VoyageAI</span>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=ffffff`}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800'
              }`
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 bg-primary-500/30 text-primary-400 text-xs rounded-md font-semibold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {user?.profileCompletion !== undefined && user.profileCompletion < 100 && (
        <div className="p-4 border-t border-dark-700">
          <div className="glass p-3 rounded-xl">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Profile Complete</span>
              <span className="text-primary-400 font-semibold">{user.profileCompletion}%</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-primary-600 to-primary-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${user.profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64">
          <SidebarContent />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
