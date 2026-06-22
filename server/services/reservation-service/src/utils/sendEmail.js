const nodemailer = require("nodemailer");

function hasSendGridConfig() {
  return Boolean(process.env.SENDGRID_API_KEY);
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createSendGridTransporter() {
  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
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
    console.log("[email:dev]", { to, subject, text });
    return { skipped: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@lounge.local",
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;
