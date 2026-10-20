import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, FileText, Lock, Eye, EyeOff, Camera, CheckCircle, Loader2, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/aiService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('profile');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries(['dashboard']);
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const avatarMutation = useMutation({
    mutationFn: (formData) => userService.uploadAvatar(formData),
    onSuccess: (res) => {
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    },
    onError: () => toast.error('Failed to upload avatar.'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password.'),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    avatarMutation.mutate(formData);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    passwordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  const sections = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: Settings },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-white">👤 My Profile</h1>

      {/* Avatar Section */}
      <div className="glass-dark rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=ffffff&size=200`}
            alt="Avatar"
            className="w-24 h-24 rounded-2xl object-cover border-2 border-primary-500/40"
          />
          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
            <Camera size={14} className="text-white" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
          </label>
          {avatarMutation.isPending && (
            <div className="absolute inset-0 bg-dark-900/80 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="text-primary-400 animate-spin" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            {user?.isVerified ? (
              <span className="badge-success badge"><CheckCircle size={12} />Verified</span>
            ) : (
              <span className="badge-warning badge">Not Verified</span>
            )}
            <span className="badge bg-dark-700 text-slate-400 capitalize">{user?.provider}</span>
          </div>
          {/* Profile Completion */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-dark-700 rounded-full h-1.5 w-32">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-600 to-primary-400" style={{ width: `${user?.profileCompletion || 0}%` }} />
            </div>
            <span className="text-primary-400 text-xs font-semibold">{user?.profileCompletion || 0}% complete</span>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-slate-400 hover:text-white hover:bg-dark-800'}`}>
            <s.icon size={15} />{s.label}
          </button>
        ))}
      </div>

      {/* Profile Info Section */}
      {activeSection === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Personal Information</h2>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><User size={14} />Full Name</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><Phone size={14} />Phone</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="input-field" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><Mail size={14} />Email</label>
                <input value={user?.email || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><MapPin size={14} />Location</label>
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="input-field" placeholder="City, Country" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><FileText size={14} />Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} maxLength={500} className="input-field resize-none" placeholder="Tell us about your travel style..." />
              <div className="text-slate-600 text-xs mt-1 text-right">{form.bio.length}/500</div>
            </div>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary px-6 py-3 flex items-center gap-2">
              {updateMutation.isPending ? <><Loader2 size={16} className="animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Change Password</h2>
          {user?.provider === 'google' ? (
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-2xl">🔵</div>
              <div>
                <p className="text-white font-medium">Google Account</p>
                <p className="text-slate-400 text-sm">You're signed in with Google. Password management is handled by Google.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} type={showCurrentPass ? 'text' : 'password'} required className="input-field pl-10 pr-10" placeholder="Current password" />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} type={showNewPass ? 'text' : 'password'} required minLength={8} className="input-field pl-10 pr-10" placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} type="password" required className="input-field pl-10" placeholder="Repeat new password" />
                </div>
              </div>
              <button type="submit" disabled={passwordMutation.isPending} className="btn-primary px-6 py-3 flex items-center gap-2">
                {passwordMutation.isPending ? <><Loader2 size={16} className="animate-spin" />Updating...</> : 'Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      )}

      {/* Account Section */}
      {activeSection === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Account Information</h2>
          <div className="space-y-4">
            {[
              { label: 'Account Type', value: user?.provider === 'google' ? 'Google Account' : 'Email Account' },
              { label: 'Email Verified', value: user?.isVerified ? 'Yes ✅' : 'No ⚠️' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
              { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'N/A' },
              { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className="text-slate-200 text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
