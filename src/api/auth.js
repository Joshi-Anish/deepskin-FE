import client from './client';

export const registerPatient = (payload) => client.post('/auth/register/', payload);

export const registerDoctor = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  return client.post('/auth/doctors/register/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const login = (username, password) => client.post('/auth/login/', { username, password });

export const getMe = () => client.get('/auth/me/');