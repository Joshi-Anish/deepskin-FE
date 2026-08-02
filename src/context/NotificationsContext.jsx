import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import * as notificationsApi from '../api/notifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return undefined;
    }
    let active = true;
    notificationsApi
      .getNotifications()
      .then(({ data }) => { if (active) setItems(data); })
      .catch(() => { /* stream will resync on reconnect */ });
    return () => { active = false; };
  }, [user]);

  // Real-time push. EventSource auto-reconnects; if the connection drops we
  // already have the persisted list, and the next message re-syncs anyway.
  useEffect(() => {
    if (!user) return undefined;
    const token = localStorage.getItem('deepskin-access-token');
    if (!token) return undefined;

    const source = new EventSource(notificationsApi.notificationsStreamUrl(token));
    source.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data);
        setItems((current) => {
          if (current.some((n) => n.id === notif.id)) return current;
          return [notif, ...current];
        });
      } catch (error) {
        // Ignore malformed events (e.g. heartbeat or partial payloads).
      }
    };
    source.onerror = () => { /* EventSource reconnects automatically */ };

    return () => { source.close(); };
  }, [user]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read_at).length, [items]);

  const markRead = useCallback(async (id) => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    try { await notificationsApi.markNotificationRead(id); } catch (error) { /* keep local state */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    try { await notificationsApi.markAllNotificationsRead(); } catch (error) { /* keep local state */ }
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, markRead, markAllRead }),
    [items, unreadCount, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationsProvider');
  return value;
};
