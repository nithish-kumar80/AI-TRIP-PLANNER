import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, Sun, Moon, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/aiService';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="bg-dark-900/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2">
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="hidden lg:block">
            <span className="text-xl font-black gradient-text">✈️ VoyageAI</span>
          </Link>
        </div>

        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search destinations, hotels..."
              className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="btn-ghost p-2 rounded-xl relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-dark-700">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifData?.notifications?.length > 0 ? (
                      notifData.notifications.slice(0, 5).map((n) => (
                        <div key={n._id} className={`p-4 border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                          <p className="text-sm font-medium text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 glass px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=ffffff`}
                alt="avatar"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="hidden sm:block text-sm font-medium text-slate-200 max-w-24 truncate">{user?.name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-dark-700 hover:text-white transition-colors">
                    <User size={16} /> Profile
                  </Link>
                  <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-dark-700 hover:text-white transition-colors">
                    <Settings size={16} /> Settings
                  </Link>
                  <div className="border-t border-dark-700" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
