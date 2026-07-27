import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('deepskin-access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const refresh = localStorage.getItem('deepskin-refresh-token');
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login/refresh/`, { refresh });
        localStorage.setItem('deepskin-access-token', data.access);
        err.config.headers.Authorization = `Bearer ${data.access}`;
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