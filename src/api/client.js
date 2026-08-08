import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
});

// ModelScope's hosting gateway strips the standard `Authorization` header and
// answers browser CORS preflights without allowing any custom header, so the
// bearer token is sent in the query string (`?token=`), which the backend is
// configured to read and needs no preflight.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('deepskin-access-token');
  if (token) config.params = { ...config.params, token };
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const refresh = localStorage.getItem('deepskin-refresh-token');
        const { data } = await axios.post(`${BASE_URL}/auth/login/refresh/`, { refresh });
        localStorage.setItem('deepskin-access-token', data.access);
        err.config.params = { ...err.config.params, token: data.access };
        return client(err.config);
      } catch {
        localStorage.removeItem('deepskin-access-token');
        localStorage.removeItem('deepskin-refresh-token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;