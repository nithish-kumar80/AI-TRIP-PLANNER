import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: (email) => authService.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send reset email.'),
  });

  return (
    <div className="glass-dark rounded-3xl p-8">
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔑</div>
              <h1 className="text-2xl font-black text-white">Forgot Password?</h1>
              <p className="text-slate-400 mt-2">Enter your email and we'll send you a reset link.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(email); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                {mutation.isPending ? <><Loader2 size={18} className="animate-spin" />Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
            <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3">Check your inbox!</h2>
            <p className="text-slate-400 mb-2">We've sent a password reset link to</p>
            <p className="text-primary-400 font-semibold mb-6">{email}</p>
            <p className="text-slate-500 text-sm">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <Link to="/auth/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm mt-6 transition-colors">
        <ArrowLeft size={14} /> Back to Login
      </Link>
    </div>
  );
}
