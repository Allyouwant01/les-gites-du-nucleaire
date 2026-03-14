const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

// Client HTTP pour communiquer avec l'API Express
async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// API Auth
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) => fetchAPI('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchAPI<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: (token: string) =>
    fetchAPI<{ user: any }>('/api/auth/me', { token }),

  updateProfile: (token: string, data: any) =>
    fetchAPI('/api/auth/profile', { method: 'PUT', token, body: JSON.stringify(data) }),
};

// API Centrales
export const plantsAPI = {
  getAll: () => fetchAPI<{ plants: any[] }>('/api/plants'),

  getById: (id: string) => fetchAPI<{ plant: any }>(`/api/plants/${id}`),

  getListings: (id: string, params?: URLSearchParams) =>
    fetchAPI<{ listings: any[]; pagination: any }>(
      `/api/plants/${id}/listings${params ? `?${params}` : ''}`,
    ),
};

// API Logements
export const listingsAPI = {
  getById: (id: string) => fetchAPI<{ listing: any }>(`/api/listings/${id}`),

  create: (token: string, data: any) =>
    fetchAPI('/api/listings', { method: 'POST', token, body: JSON.stringify(data) }),

  update: (token: string, id: string, data: any) =>
    fetchAPI(`/api/listings/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),

  delete: (token: string, id: string) =>
    fetchAPI(`/api/listings/${id}`, { method: 'DELETE', token }),

  getAvailability: (id: string) =>
    fetchAPI<{ availabilities: any[] }>(`/api/listings/${id}/availability`),

  updateAvailability: (token: string, id: string, data: any) =>
    fetchAPI(`/api/listings/${id}/availability`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  getMyListings: (token: string) =>
    fetchAPI<{ listings: any[] }>('/api/listings/owner/my-listings', { token }),

  uploadPhotos: async (token: string, id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    const response = await fetch(`${API_URL}/api/listings/${id}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(error.error);
    }

    return response.json();
  },
};

// API Réservations
export const bookingsAPI = {
  create: (token: string, data: any) =>
    fetchAPI('/api/bookings', { method: 'POST', token, body: JSON.stringify(data) }),

  getAll: (token: string, params?: URLSearchParams) =>
    fetchAPI<{ bookings: any[] }>(`/api/bookings${params ? `?${params}` : ''}`, { token }),

  getById: (token: string, id: string) =>
    fetchAPI<{ booking: any }>(`/api/bookings/${id}`, { token }),

  confirm: (token: string, id: string) =>
    fetchAPI(`/api/bookings/${id}/confirm`, { method: 'PUT', token }),

  cancel: (token: string, id: string) =>
    fetchAPI(`/api/bookings/${id}/cancel`, { method: 'PUT', token }),

  splitInvite: (token: string, id: string, data: any) =>
    fetchAPI(`/api/bookings/${id}/split-invite`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),
};

// API Paiements
export const paymentsAPI = {
  createWeekly: (token: string, paymentId: string) =>
    fetchAPI<{ clientSecret: string }>('/api/payments/weekly', {
      method: 'POST',
      token,
      body: JSON.stringify({ paymentId }),
    }),

  confirmCard: (token: string, paymentIntentId: string) =>
    fetchAPI('/api/payments/confirm-card', {
      method: 'POST',
      token,
      body: JSON.stringify({ paymentIntentId }),
    }),

  confirmCash: (token: string, bookingId: string, weekNumber: number) =>
    fetchAPI('/api/payments/cash-confirm', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookingId, weekNumber }),
    }),

  getDeposit: (token: string, bookingId: string) =>
    fetchAPI('/api/payments/deposit', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookingId }),
    }),
};

// API Abonnements
export const subscriptionsAPI = {
  create: (token: string) =>
    fetchAPI<{ subscriptionId: string; clientSecret: string }>(
      '/api/subscriptions/create',
      { method: 'POST', token },
    ),

  cancel: (token: string) =>
    fetchAPI('/api/subscriptions/cancel', { method: 'DELETE', token }),

  getStatus: (token: string) =>
    fetchAPI<{ subscription: any }>('/api/subscriptions/status', { token }),
};

// API Messages
export const messagesAPI = {
  getConversations: (token: string) =>
    fetchAPI<{ conversations: any[] }>('/api/messages/conversations', { token }),

  getMessages: (token: string, conversationId: string, page?: number) =>
    fetchAPI<{ messages: any[]; pagination: any }>(
      `/api/messages/${conversationId}${page ? `?page=${page}` : ''}`,
      { token },
    ),

  send: (token: string, data: any) =>
    fetchAPI('/api/messages', { method: 'POST', token, body: JSON.stringify(data) }),
};

// API Avis
export const reviewsAPI = {
  getByListing: (id: string, page?: number) =>
    fetchAPI<{ reviews: any[]; stats: any; pagination: any }>(
      `/api/reviews/listing/${id}${page ? `?page=${page}` : ''}`,
    ),

  create: (token: string, data: any) =>
    fetchAPI('/api/reviews', { method: 'POST', token, body: JSON.stringify(data) }),

  respond: (token: string, id: string, response: string) =>
    fetchAPI(`/api/reviews/${id}/respond`, {
      method: 'POST',
      token,
      body: JSON.stringify({ response }),
    }),
};

// API Admin
export const adminAPI = {
  getDashboard: (token: string) =>
    fetchAPI<{ stats: any }>('/api/admin/dashboard', { token }),

  getPendingListings: (token: string) =>
    fetchAPI<{ listings: any[] }>('/api/admin/listings/pending', { token }),

  verifyListing: (token: string, id: string, data: { isVerified: boolean; adminComment?: string }) =>
    fetchAPI(`/api/admin/listings/${id}/verify`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  getUsers: (token: string, params?: URLSearchParams) =>
    fetchAPI<{ users: any[]; pagination: any }>(
      `/api/admin/users${params ? `?${params}` : ''}`,
      { token },
    ),
};

// API Notifications
export const notificationsAPI = {
  getAll: (token: string, page?: number) =>
    fetchAPI<{ notifications: any[]; unreadCount: number }>(
      `/api/notifications${page ? `?page=${page}` : ''}`,
      { token },
    ),

  markRead: (token: string, id: string) =>
    fetchAPI(`/api/notifications/${id}/read`, { method: 'PUT', token }),

  markAllRead: (token: string) =>
    fetchAPI('/api/notifications/read-all', { method: 'PUT', token }),
};
