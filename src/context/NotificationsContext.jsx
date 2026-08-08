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

  // Real-time push via fetch + ReadableStream.  Using the custom
  // `X-DSK-Token` header (ModelScope's gateway strips `Authorization`), and
  // avoiding a JWT in the query-string prevents Firefox/privacy-extension
  // blocking of long bearer tokens in URLs.
  //
  // Resilient loop: never gives up permanently.  Re-reads a fresh access
  // token before every attempt (the axios interceptor in api/client.js may
  // rotate the token in localStorage during the session), refreshes the token
  // on a 401, and retries after any transient failure (e.g. the backend being
  // momentarily down during startup), so the stream self-heals across
  // restarts and token expiry.
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    let controller = new AbortController();
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

    async function refreshAccessToken() {
      const refresh = localStorage.getItem('deepskin-refresh-token');
      if (!refresh) return false;
      try {
        const res = await fetch(`${BASE_URL}/auth/login/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;
        const { access } = await res.json();
        if (access) localStorage.setItem('deepskin-access-token', access);
        return Boolean(access);
      } catch {
        return false;
      }
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function connect() {
      while (active) {
        try {
          const token = localStorage.getItem('deepskin-access-token');
          if (!token) { if (active) await sleep(3000); continue; }

          const res = await fetch(notificationsApi.notificationsStreamUrl(), {
            headers: { 'X-DSK-Token': `Bearer ${token}` },
            signal: controller.signal,
          });

          // Auth failure: try to refresh the token, then reconnect.
          if (res.status === 401) {
            await refreshAccessToken();
            if (active) await sleep(2000);
            continue;
          }
          if (!res.ok) {
            if (active) await sleep(3000);
            continue;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (active) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();
            for (const part of parts) {
              const line = part.trim();
              if (!line || line.startsWith(':')) continue;
              if (line.startsWith('data: ')) {
                try {
                  const notif = JSON.parse(line.slice(6));
                  setItems((current) => {
                    if (current.some((n) => n.id === notif.id)) return current;
                    return [notif, ...current];
                  });
                } catch { /* malformed JSON — ignore */ }
              }
            }
          }
        } catch (err) {
          if (!active || err.name === 'AbortError') return;
        }
        // Reconnect after a short delay unless unmounted.
        if (active) await sleep(3000);
      }
    }
    connect();

    return () => { active = false; controller.abort(); };
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
