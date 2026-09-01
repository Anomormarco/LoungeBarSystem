require("dotenv/config");

// Thin client for QPay Merchant V2 (https://developer.qpay.mn).
// Auth: POST /v2/auth/token with Basic base64(client_id:client_secret) -> access_token.
// The token is cached in memory and re-fetched a little before it actually expires.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function qpayBaseUrl() {
  return (process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn").trim().replace(/\/$/, "");
}

function qpayConfigured() {
  return Boolean(
    process.env.QPAY_CLIENT_ID?.trim() &&
      process.env.QPAY_CLIENT_SECRET?.trim() &&
      process.env.QPAY_INVOICE_CODE?.trim()
  );
}

async function qpayFetch(path, { method = "GET", body, authorization }) {
  const res = await fetch(`${qpayBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = data?.message || data?.error || data?.raw || `QPay API алдаа (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.qpayResponse = data;
    throw error;
  }

  return data;
}

async function fetchAccessToken() {
  const basic = Buffer.from(`${process.env.QPAY_CLIENT_ID}:${process.env.QPAY_CLIENT_SECRET}`).toString("base64");
  const data = await qpayFetch("/v2/auth/token", {
    method: "POST",
    authorization: `Basic ${basic}`,
  });

  const expiresInSeconds = Number(data.expires_in) || 3600;
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + Math.max(expiresInSeconds - 60, 30) * 1000;
  return cachedToken;
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }
  return fetchAccessToken();
}

async function authorizedRequest(path, options = {}, { retryOn401 = true } = {}) {
  const token = await getAccessToken();
  try {
    return await qpayFetch(path, { ...options, authorization: `Bearer ${token}` });
  } catch (error) {
    if (retryOn401 && error.status === 401) {
      cachedToken = null;
      const freshToken = await getAccessToken();
      return qpayFetch(path, { ...options, authorization: `Bearer ${freshToken}` });
    }
    throw error;
  }
}

async function createInvoice({ senderInvoiceNo, description, amount, callbackUrl }) {
  return authorizedRequest("/v2/invoice", {
    method: "POST",
    body: {
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: String(senderInvoiceNo),
      invoice_receiver_code: "terminal",
      invoice_description: String(description || "Subscription").slice(0, 190),
      amount: Number(amount),
      callback_url: callbackUrl,
    },
  });
}

// Authoritative status check - always ask QPay directly rather than trusting
// whatever a caller (including a webhook ping) claims the status is.
async function checkPayment(invoiceId) {
  return authorizedRequest("/v2/payment/check", {
    method: "POST",
    body: {
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
  });
}

async function cancelInvoice(invoiceId) {
  return authorizedRequest(`/v2/invoice/${invoiceId}`, { method: "DELETE" });
}

module.exports = {
  qpayConfigured,
  createInvoice,
  checkPayment,
  cancelInvoice,
};
