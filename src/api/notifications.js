import client from './client';

// unwraps DRF's { count, next, previous, results } pagination shape into a plain array
const unwrap = (res) => ({ ...res, data: res.data.results ?? res.data });

export const getNotifications = () => client.get('/notifications/').then(unwrap);
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => client.post('/notifications/read-all/');

export function notificationsStreamUrl(token) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${base}/notifications/stream/?token=${encodeURIComponent(token)}`;
}
