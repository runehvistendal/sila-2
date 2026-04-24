const API_URL = import.meta.env.VITE_API_URL || 'https://sila-2-production.up.railway.app';

// Hent token fra localStorage
const getToken = () => localStorage.getItem('payload_token');

// Gem token i localStorage
const setToken = (token) => localStorage.setItem('payload_token', token);

// Fjern token fra localStorage
const removeToken = () => localStorage.removeItem('payload_token');

// Basis fetch funktion
const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `JWT ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API fejl');
  }

  return response.json();
};

// Auth
export const auth = {
  login: async (email, password) => {
    const data = await apiFetch('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    return data;
  },
  logout: async () => {
    await apiFetch('/users/logout', { method: 'POST' });
    removeToken();
  },
  me: () => apiFetch('/users/me'),
  isLoggedIn: () => !!getToken(),
};

// Generisk collection CRUD
const collection = (slug) => ({
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/${slug}${query ? `?${query}` : ''}`);
  },
  get: (id) => apiFetch(`/${slug}/${id}`),
  create: (data) => apiFetch(`/${slug}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/${slug}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/${slug}/${id}`, { method: 'DELETE' }),
});

// Collections
export const Cabins = collection('cabins');
export const Bookings = collection('bookings');
export const Transport = collection('transport');
export const Reviews = collection('reviews');
export const Support = collection('support');
export const Media = collection('media');
export const Users = collection('users');