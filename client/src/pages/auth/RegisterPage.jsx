import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  if (!password) return null;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLength = password.length >= 8;
  const score = [hasLower, hasUpper, hasNumber, hasLength].filter(Boolean).length;
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-dark-600'}`} />
        ))}
      </div>
      {score > 0 && <p className={`text-xs mt-1 ${score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-yellow-400' : score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{labels[score]}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const registerMutation = useMutation({
    mutationFn: (data) => authService.register({ name: data.name, email: data.email, password: data.password }),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      toast.success('Account created! Check your email to verify your account. 🎉');
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed.');
    },
  });

  return (
    <div className="glass-dark rounded-3xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white">Create your account</h1>
        <p className="text-slate-400 mt-2">Start planning your dream trips today</p>
      </div>

      <button onClick={() => authService.googleLogin()} className="w-full flex items-center justify-center gap-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-dark-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-600" /></div>
        <div className="relative flex justify-center"><span className="px-4 bg-dark-800 text-slate-500 text-sm rounded">or sign up with email</span></div>
      </div>

      <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })} placeholder="John Doe" className="input-field pl-10" />
          </div>
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} type="email" placeholder="you@example.com" className="input-field pl-10" />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' }, pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase, lowercase, and a number' } })} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          <PasswordStrength password={password} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input {...register('confirmPassword', { required: 'Please confirm your password', validate: (v) => v === password || 'Passwords do not match' })} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10 pr-10" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input {...register('terms', { required: 'You must accept the terms' })} type="checkbox" className="w-4 h-4 mt-0.5 rounded border-dark-600 bg-dark-700 accent-primary-500" />
          <span className="text-slate-400 text-sm">I agree to the <a href="#" className="text-primary-400 hover:text-primary-300">Terms of Service</a> and <a href="#" className="text-primary-400 hover:text-primary-300">Privacy Policy</a></span>
        </label>
        {errors.terms && <p className="text-red-400 text-xs">{errors.terms.message}</p>}

        <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {registerMutation.isPending ? (<><Loader2 size={18} className="animate-spin" />Creating account...</>) : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
