import { createContext, useContext, useMemo, useState } from 'react';
import { mockApi } from '../api/mockApi';
import { useAppData } from './AppDataContext';

const AuthContext = createContext(null);
const SESSION_KEY = 'deepskin-demo-session';

export function AuthProvider({ children }) {
  const { users } = useAppData();
  const [userId, setUserId] = useState(() => localStorage.getItem(SESSION_KEY));
  const user = users.find((entry) => entry.id === userId) || null;

  const login = async (email, password) => {
    const account = await mockApi.login(users, email, password);
    localStorage.setItem(SESSION_KEY, account.id);
    setUserId(account.id);
    return account;
  };

  const loginAs = (id) => {
    localStorage.setItem(SESSION_KEY, id);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUserId(null);
  };

  const value = useMemo(() => ({ user, login, loginAs, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
