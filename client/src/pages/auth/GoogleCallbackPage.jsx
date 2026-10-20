import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import PageLoader from '../../components/common/PageLoader';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/auth/login');
      return;
    }

    if (token) {
      // Fetch user info with the token
      authService.getMe(token)
        .then((res) => {
          login(res.data.data.user, token);
          toast.success('Signed in with Google! 🎉');
          navigate('/dashboard');
        })
        .catch(() => {
          toast.error('Authentication failed.');
          navigate('/auth/login');
        });
    } else {
      navigate('/auth/login');
    }
  }, []);

  return <PageLoader />;
}
