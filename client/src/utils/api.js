const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

export async function request(path, options = {}) {
  const tokenKey = options.tokenKey || 'owner_token';
  const token = localStorage.getItem(tokenKey);
  const timeoutMs = options.timeoutMs || 30000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  const url = `${API_URL}${path}`;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    console.error('API connection failed:', { url, error });
    if (error.name === 'AbortError') {
      throw new Error(`API server хариу өгөхгүй байна. ${url}`);
    }
    throw new Error(`API server холбогдохгүй байна. ${url} (${error.message})`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = 'Үйлдэл амжилтгүй боллоо';
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch (e) {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export const publicApi = {
  getNearbyOrganizations: (lat, lng, radius = 10, filters = {}) => {
    const params = new URLSearchParams({ lat, lng, radius });

    if (filters.q) params.set('q', filters.q);
    if (filters.tableType && filters.tableType !== 'all') params.set('tableType', filters.tableType);
    if (filters.availableOnly) params.set('availableOnly', 'true');

    return request(`/organizations/nearby?${params.toString()}`, { tokenKey: null });
  },
  getOrganization: (id) => request(`/organizations/${id}`, { tokenKey: null }),
  getOrganizationMenu: (id) => request(`/organizations/${id}/menu`, { tokenKey: null }),
  getOrganizationTables: (id) => request(`/organizations/${id}/tables`, { tokenKey: null }),
  createReservation: (payload) =>
    request('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
      tokenKey: null,
    }),
  sendOtp: (email, reservationId) =>
    request('/reservations/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, reservationId }),
      tokenKey: null,
    }),
  verifyOtp: (email, code, reservationId) =>
    request('/reservations/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code, reservationId }),
      tokenKey: null,
    }),
};

export const api = {
  login: (email, password) =>
    request('/owner/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  registerOwner: (payload) =>
    request('/owner/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      tokenKey: null,
    }),
  changePassword: (currentPassword, newPassword) =>
    request('/owner/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getReservations: () => request('/owner/reservations'),
  confirmReservation: (id) => request(`/owner/reservations/${id}/confirm`, { method: 'PUT' }),
  cancelReservation: (id) => request(`/owner/reservations/${id}/cancel`, { method: 'PUT' }),
  completeReservation: (id) => request(`/owner/reservations/${id}/complete`, { method: 'PUT' }),
  getOwnerOrganization: () => request('/owner/organization'),
  updateOwnerOrganization: (payload) =>
    request('/owner/organization', { method: 'PUT', body: JSON.stringify(payload) }),
  getTables: () => request('/owner/tables'),
  createTable: (table) =>
    request('/owner/tables', { method: 'POST', body: JSON.stringify(table) }),
  updateTable: (id, table) =>
    request(`/owner/tables/${id}`, { method: 'PUT', body: JSON.stringify(table) }),
  deleteTable: (id) => request(`/owner/tables/${id}`, { method: 'DELETE' }),
  getMenuItems: () => request('/owner/menu-items'),
  createMenuItem: (item) =>
    request('/owner/menu-items', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id, item) =>
    request(`/owner/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteMenuItem: (id) => request(`/owner/menu-items/${id}`, { method: 'DELETE' }),
  getStaff: () => request('/owner/staff'),
  createStaff: (member) =>
    request('/owner/staff', { method: 'POST', body: JSON.stringify(member) }),
  updateStaff: (id, member) =>
    request(`/owner/staff/${id}`, { method: 'PUT', body: JSON.stringify(member) }),
  deleteStaff: (id) => request(`/owner/staff/${id}`, { method: 'DELETE' }),
  getStatistics: (range = '7d') => request(`/owner/statistics?range=${range}`),
  getSubscription: () => request('/owner/subscription'),
  createStripeCheckout: (amount, planType, successUrl, cancelUrl, periodDays = 30) =>
    request('/payments/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount, planType, successUrl, cancelUrl, periodDays }),
    }),
  createStripePortal: (returnUrl) =>
    request('/payments/stripe/customer-portal', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    }),
  createQpayInvoice: (amount, planType, periodDays = 30) =>
    request('/payments/qpay/create-invoice', {
      method: 'POST',
      body: JSON.stringify({ amount, planType, periodDays }),
    }),
  simulateQpayPayment: (paymentId, status) =>
    request('/payments/webhook/qpay', {
      method: 'POST',
      body: JSON.stringify({ paymentId, status }),
    }),
};

export const adminApi = {
  login: (email, password) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      tokenKey: 'admin_token',
    }),
  getStatistics: () => request('/admin/statistics', { tokenKey: 'admin_token' }),
  getOrganizations: () => request('/admin/organizations', { tokenKey: 'admin_token' }),
  createOrganization: (payload) =>
    request('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
      tokenKey: 'admin_token',
    }),
  updateOrganization: (id, payload) =>
    request(`/admin/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      tokenKey: 'admin_token',
    }),
  deleteOrganization: (id) =>
    request(`/admin/organizations/${id}`, { method: 'DELETE', tokenKey: 'admin_token' }),
  approveOrganization: (id) =>
    request(`/admin/organizations/${id}/approve`, { method: 'PUT', tokenKey: 'admin_token' }),
  disableOrganization: (id) =>
    request(`/admin/organizations/${id}/disable`, { method: 'PUT', tokenKey: 'admin_token' }),
};

export { API_URL, SOCKET_URL };
