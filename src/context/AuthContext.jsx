import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../api/auth';

const AuthContext = createContext(null);
const TOKEN_KEY = 'deepskin-access-token';
const REFRESH_KEY = 'deepskin-refresh-token';

function normalizeUser(apiUser) {
  return {
    id: apiUser.id,
    role: apiUser.role,
    fullName: apiUser.username,
    specialty: apiUser.specialty,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    getMe()
      .then(({ data }) => setUser(normalizeUser(data)))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await apiLogin(username, password);
    localStorage.setItem(TOKEN_KEY, data.access);
    localStorage.setItem(REFRESH_KEY, data.refresh);
    const { data: me } = await getMe();
    const normalized = normalizeUser(me);
    setUser(normalized);
    return normalized;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};