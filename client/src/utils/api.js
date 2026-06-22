const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function request(path, options = {}) {
  const tokenKey = options.tokenKey || 'owner_token';
  const token = localStorage.getItem(tokenKey);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

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
  getNearbyOrganizations: (lat, lng, radius = 10) =>
    request(`/organizations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, { tokenKey: null }),
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
  getReservations: () => request('/owner/reservations'),
  confirmReservation: (id) => request(`/owner/reservations/${id}/confirm`, { method: 'PUT' }),
  cancelReservation: (id) => request(`/owner/reservations/${id}/cancel`, { method: 'PUT' }),
  completeReservation: (id) => request(`/owner/reservations/${id}/complete`, { method: 'PUT' }),
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
  createStripeCheckout: (organizationId, amount, planType, successUrl, cancelUrl) =>
    request('/payments/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ organizationId, amount, planType, successUrl, cancelUrl }),
    }),
  createQpayInvoice: (organizationId, amount, planType) =>
    request('/payments/qpay/create-invoice', {
      method: 'POST',
      body: JSON.stringify({ organizationId, amount, planType }),
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

export { API_URL };
