/**
 * SILA API CLIENT
 * 
 * Dette erstatter base44Client.js.
 * Alle kald går til din egen Payload CMS backend.
 * 
 * Sæt VITE_API_URL i din frontend .env:
 * VITE_API_URL=http://localhost:3000  (udvikling)
 * VITE_API_URL=https://api.sila.gl   (produktion)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Basis fetch-funktion med auth og fejlhåndtering
 */
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Send cookies (JWT token)
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ukendt fejl' }))
    throw new Error(error.message || error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================
// AUTH
// ============================================================
export const auth = {
  /** Log ind */
  login: (email, password) =>
    apiFetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Log ud */
  logout: () =>
    apiFetch('/api/users/logout', { method: 'POST' }),

  /** Hent den aktuelle bruger */
  me: () =>
    apiFetch('/api/users/me'),

  /** Registrer ny bruger */
  register: (data) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Skift aktivt dashboard (gæst/udbyder) — valideres server-side */
  switchDashboard: (dashboard) =>
    apiFetch('/api/auth/switch-dashboard', {
      method: 'POST',
      body: JSON.stringify({ dashboard }),
    }),

  /** Anmod om kontosletning (GDPR) */
  deleteAccount: () =>
    apiFetch('/api/auth/delete-account', { method: 'DELETE' }),
}

// ============================================================
// CABINS (HYTTER)
// ============================================================
export const cabins = {
  /** Hent alle publicerede hytter med filtrering */
  list: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.set('where[title][like]', filters.search)
    if (filters.location && filters.location !== 'all') {
      params.set('where[location.city][like]', filters.location)
    }
    if (filters.minPrice) params.set('where[pricePerNight][greater_than_equal]', filters.minPrice)
    if (filters.maxPrice) params.set('where[pricePerNight][less_than_equal]', filters.maxPrice)
    if (filters.minGuests) params.set('where[maxGuests][greater_than_equal]', filters.minGuests)
    params.set('where[status][equals]', 'published')
    params.set('limit', filters.limit || '50')
    params.set('sort', filters.sort === 'price_asc' ? 'pricePerNight' : '-createdAt')
    return apiFetch(`/api/cabins?${params}`)
  },

  /** Hent én hytte */
  get: (id) => apiFetch(`/api/cabins/${id}`),

  /** Opret hytte (kræver provider-rolle) */
  create: (data) =>
    apiFetch('/api/cabins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Opdater hytte */
  update: (id, data) =>
    apiFetch(`/api/cabins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** Slet hytte */
  delete: (id) =>
    apiFetch(`/api/cabins/${id}`, { method: 'DELETE' }),

  /** Hent mine hytter (som udbyder) */
  myListings: () =>
    apiFetch('/api/cabins?where[owner][equals]=me&limit=100'),
}

// ============================================================
// TRANSPORT
// ============================================================
export const transport = {
  list: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.type) params.set('where[type][equals]', filters.type)
    if (filters.fromLocation) params.set('where[fromLocation][like]', filters.fromLocation)
    params.set('where[status][equals]', 'published')
    params.set('limit', '50')
    return apiFetch(`/api/transport?${params}`)
  },
  get: (id) => apiFetch(`/api/transport/${id}`),
  create: (data) =>
    apiFetch('/api/transport', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/transport/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) =>
    apiFetch(`/api/transport/${id}`, { method: 'DELETE' }),
}

// ============================================================
// BOOKINGER
// ============================================================
export const bookings = {
  /** Opret booking — pris beregnes server-side */
  create: (data) =>
    apiFetch('/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Hent mine bookinger */
  list: () => apiFetch('/api/bookings?limit=100'),

  /** Hent én booking */
  get: (id) => apiFetch(`/api/bookings/${id}`),

  /** Afbestil booking */
  cancel: (id, reason) =>
    apiFetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled_guest', cancellationReason: reason }),
    }),
}

// ============================================================
// REVIEWS
// ============================================================
export const reviews = {
  /** Hent reviews for én listing */
  forCabin: (cabinId) =>
    apiFetch(`/api/reviews?where[cabin][equals]=${cabinId}&where[status][equals]=approved`),

  /** Hent reviews for én transport */
  forTransport: (transportId) =>
    apiFetch(`/api/reviews?where[transport][equals]=${transportId}&where[status][equals]=approved`),

  /** Hent reviews for én bruger */
  forUser: (userId) =>
    apiFetch(`/api/reviews?where[reviewedUser][equals]=${userId}&where[status][equals]=approved`),

  /** Opret review */
  create: (data) =>
    apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
}

// ============================================================
// STRIPE
// ============================================================
export const stripe = {
  /** Start Stripe Connect onboarding */
  connectAccount: () =>
    apiFetch('/api/stripe/connect', { method: 'POST' }),
}

// ============================================================
// SUPPORT
// ============================================================
export const support = {
  /** Opret support-ticket */
  create: (data) =>
    apiFetch('/api/support', { method: 'POST', body: JSON.stringify(data) }),

  /** Hent mine tickets */
  list: () => apiFetch('/api/support?limit=50'),
}

// ============================================================
// EKSPORTER SOM ÉN API-OBJEKT (drop-in replacement for base44)
// ============================================================
export const api = {
  auth,
  cabins,
  transport,
  bookings,
  reviews,
  stripe,
  support,
}

export default api
