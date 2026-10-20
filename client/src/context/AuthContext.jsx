import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  const fetchMe = useCallback(async (token) => {
    try {
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.data.user);
      return res.data.data.user;
    } catch {
      return null;
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken: newToken, user: refreshedUser } = res.data.data;
      setAccessToken(newToken);
      setUser(refreshedUser);
      localStorage.setItem('accessToken', newToken);
      return newToken;
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('accessToken');
      if (stored) {
        setAccessToken(stored);
        const u = await fetchMe(stored);
        if (!u) {
          const newToken = await refreshAccessToken();
          if (newToken) await fetchMe(newToken);
        }
      }
      setLoading(false);
    };
    init();
  }, [fetchMe, refreshAccessToken]);

  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  const updateUser = (userData) => setUser((prev) => ({ ...prev, ...userData }));

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, logout, updateUser, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
