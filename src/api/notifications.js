import client from './client';

// unwraps DRF's { count, next, previous, results } pagination shape into a plain array
const unwrap = (res) => ({ ...res, data: res.data.results ?? res.data });

export const getNotifications = () => client.get('/notifications/').then(unwrap);
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => client.post('/notifications/read-all/');

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const notificationsStreamUrl = () => `${BASE_URL}/notifications/stream/`;
