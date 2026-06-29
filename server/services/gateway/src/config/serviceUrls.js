module.exports = {
  auth: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
  lounge: process.env.LOUNGE_SERVICE_URL || "http://lounge-service:3002",
  reservation: process.env.RESERVATION_SERVICE_URL || "http://reservation-service:3003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3004",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3005",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
