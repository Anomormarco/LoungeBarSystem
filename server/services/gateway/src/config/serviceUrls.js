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

const defaults = process.env.RENDER || process.env.RENDER_SERVICE_ID ? renderDefaults : dockerDefaults;

module.exports = {
  auth: process.env.AUTH_SERVICE_URL || defaults.auth,
  lounge: process.env.LOUNGE_SERVICE_URL || defaults.lounge,
  reservation: process.env.RESERVATION_SERVICE_URL || defaults.reservation,
  payment: process.env.PAYMENT_SERVICE_URL || defaults.payment,
  notification: process.env.NOTIFICATION_SERVICE_URL || defaults.notification,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
