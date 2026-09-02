const PROD_GATEWAY_URL = 'https://lounge-gateway.onrender.com';
const configuredApiUrl = import.meta.env.VITE_API_URL;
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL || configuredApiUrl;

function resolveServiceUrl(configuredUrl, fallbackUrl) {
  if (import.meta.env.PROD && configuredUrl && /localhost|127\.0\.0\.1/.test(configuredUrl)) {
    return fallbackUrl;
  }

  return configuredUrl || fallbackUrl;
}

const API_URL = resolveServiceUrl(configuredApiUrl, import.meta.env.PROD ? PROD_GATEWAY_URL : '/api');
const SOCKET_URL =
  resolveServiceUrl(configuredSocketUrl, import.meta.env.PROD ? PROD_GATEWAY_URL : window.location.origin);

// Render's free-tier services sleep after ~15 min idle. The first request
// that wakes one either waits out the cold start, or - if a couple of
// requests land in that same window - gets rejected outright by Render's
// own edge with `x-render-routing: hibernate-rate-limited` before our app
// ever sees it. That's a "try again in a moment", not a real error, so we
// retry it transparently instead of surfacing it to the user. 502/503/504
// usually mean the same cold-start window but *did* reach our app, so only
// retry those for safe (GET/HEAD) requests to avoid double-submitting a
// mutating call whose first attempt may have actually gone through.
// A longer (~58s) budget was tried here to ride out Render's documented
// "50 seconds or more" cold start, but that made a genuine failure look like
// the page hanging for minutes instead of erroring quickly - worse than the
// original problem when several duplicate calls each ran their own full
// retry sequence. The real fix for cold starts is keeping services warm
// (see .github/workflows/keep-render-awake.yml); this budget only needs to
// cover a short, ordinary transient blip.
const TRANSIENT_RETRY_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_DELAYS_MS = [800, 1500, 3000];
const MAX_TRANSIENT_RETRIES = RETRY_DELAYS_MS.length;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function request(path, options = {}) {
  const tokenKey = options.tokenKey === undefined ? 'owner_token' : options.tokenKey;
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;
  const timeoutMs = options.timeoutMs || 30000;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';

  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error('API connection failed:', { url, error });
      if (error.name === 'AbortError') {
        throw new Error(`API server did not respond. ${url}`, { cause: error });
      }
      throw new Error(`API server connection failed. ${url} (${error.message})`, { cause: error });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const canRetry =
        attempt < MAX_TRANSIENT_RETRIES &&
        TRANSIENT_RETRY_STATUSES.has(response.status) &&
        (response.status === 429 || isIdempotent);

      if (canRetry) {
        const retryAfterHeader = Number(response.headers.get('retry-after'));
        const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader * 1000
          : RETRY_DELAYS_MS[attempt];
        await sleep(delayMs);
        continue;
      }

      let message = `Operation failed. HTTP ${response.status}`;
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          message = errorData.message || errorData.error || message;
        } else {
          const text = await response.text();
          if (text) {
            message = `${message}: ${text.slice(0, 220)}`;
          }
        }
      } catch {
        // Keep the HTTP status fallback when the error body cannot be parsed.
      }
      throw new Error(message);
    }

    return response.json();
  }

  throw new Error('Operation failed after multiple retries.');
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
  createQpayInvoice: (amount, planType, periodDays = 30) =>
    request('/payments/qpay/create-invoice', {
      method: 'POST',
      body: JSON.stringify({ amount, planType, periodDays }),
    }),
  createQpayInvoiceWithToken: (token, amount, planType, periodDays = 30) =>
    request('/payments/qpay/create-invoice', {
      method: 'POST',
      body: JSON.stringify({ amount, planType, periodDays }),
      tokenKey: null,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  simulateQpayPayment: (paymentId, status) =>
    request('/payments/webhook/qpay', {
      method: 'POST',
      body: JSON.stringify({ paymentId, status }),
    }),
  checkQpayStatus: (paymentId) =>
    request(`/payments/qpay/status/${paymentId}`),
  checkQpayStatusWithToken: (token, paymentId) =>
    request(`/payments/qpay/status/${paymentId}`, {
      tokenKey: null,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
