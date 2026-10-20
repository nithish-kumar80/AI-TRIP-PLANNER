import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Link may be expired.');
      });
  }, [token]);

  return (
    <div className="glass-dark rounded-3xl p-8 text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={56} className="text-primary-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-black text-white mb-2">Verifying...</h2>
          <p className="text-slate-400">Please wait while we verify your email.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Email Verified! 🎉</h2>
          <p className="text-slate-400 mb-6">{message}</p>
          <Link to="/auth/login" className="btn-primary px-8 py-3">Continue to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={56} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Verification Failed</h2>
          <p className="text-slate-400 mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auth/login" className="btn-secondary px-6 py-3">Login</Link>
            <Link to="/auth/register" className="btn-primary px-6 py-3">Register</Link>
          </div>
        </>
      )}
    </div>
  );
}
