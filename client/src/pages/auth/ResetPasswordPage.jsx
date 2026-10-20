import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.resetPassword(token, password),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate('/auth/login'), 2000);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Reset failed. Link may be expired.'),
  });

  if (done) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center">
        <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Password Reset!</h2>
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-3xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-black text-white">Set New Password</h1>
        <p className="text-slate-400 mt-2">Enter your new password below.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (password !== confirm) { toast.error('Passwords do not match.'); return; } mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Min. 8 characters" className="input-field pl-10 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required placeholder="Repeat password" className="input-field pl-10" />
          </div>
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {mutation.isPending ? <><Loader2 size={18} className="animate-spin" />Resetting...</> : 'Reset Password'}
        </button>
      </form>
      <Link to="/auth/login" className="block text-center text-slate-400 hover:text-white text-sm mt-6 transition-colors">Back to Login</Link>
    </div>
  );
}
