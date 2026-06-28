const nodemailer = require("nodemailer");

function hasSendGridConfig() {
  return Boolean(process.env.SENDGRID_API_KEY);
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createSendGridTransporter() {
  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

function createSmtpTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function createTransporter() {
  if (hasSendGridConfig()) {
    return createSendGridTransporter();
  }

  if (hasSmtpConfig()) {
    return createSmtpTransporter();
  }

  return null;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error("Имэйл үйлчилгээ тохируулагдаагүй байна. SMTP_USER/SMTP_PASS эсвэл SENDGRID_API_KEY шаардлагатай.");
    error.statusCode = 503;
    throw error;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;
