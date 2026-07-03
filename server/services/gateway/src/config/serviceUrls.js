const dockerDefaults = {
  auth: "http://auth-service:3001",
  lounge: "http://lounge-service:3002",
  reservation: "http://reservation-service:3003",
  payment: "http://payment-service:3004",
  notification: "http://notification-service:3005",
};

const renderDefaults = {
  auth: "https://lounge-auth-service.onrender.com",
  lounge: "https://lounge-lounge-service.onrender.com",
  reservation: "https://lounge-reservation-service.onrender.com",
  payment: "https://lounge-payment-service.onrender.com",
  notification: "https://lounge-notification-service.onrender.com",
};

const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const defaults = isRender ? renderDefaults : dockerDefaults;

function serviceUrl(envValue, fallback, dockerHost) {
  const value = envValue || fallback;

  if (isRender && value) {
    try {
      const url = new URL(value);
      const isDockerHost = url.hostname === dockerHost || url.hostname === `lounge-${dockerHost}`;
      const isPublicRenderUrl = url.hostname.endsWith(".onrender.com");

      if (isDockerHost && !isPublicRenderUrl) {
        return fallback;
      }
    } catch (error) {
      return fallback;
    }
  }

  if (isRender && envValue && envValue.includes(`//${dockerHost}:`)) {
    return fallback;
  }

  return value;
}

module.exports = {
  auth: serviceUrl(process.env.AUTH_SERVICE_URL, defaults.auth, "auth-service"),
  lounge: serviceUrl(process.env.LOUNGE_SERVICE_URL, defaults.lounge, "lounge-service"),
  reservation: serviceUrl(process.env.RESERVATION_SERVICE_URL, defaults.reservation, "reservation-service"),
  payment: serviceUrl(process.env.PAYMENT_SERVICE_URL, defaults.payment, "payment-service"),
  notification: serviceUrl(process.env.NOTIFICATION_SERVICE_URL, defaults.notification, "notification-service"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
