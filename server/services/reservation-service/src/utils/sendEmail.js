const nodemailer = require("nodemailer");

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

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
    family: 4,
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
    family: 4,
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
  if (hasSendGridConfig() && !hasResendConfig()) {
    return createSendGridTransporter();
  }

  if (hasSmtpConfig()) {
    return createSmtpTransporter();
  }

  return null;
}

async function sendWithResend({ from, to, subject, text, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Resend имэйл илгээхэд алдаа гарлаа: ${body}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

async function sendWithSendGridApi({ from, to, subject, text, html }) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html || text },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`SendGrid имэйл илгээхэд алдаа гарлаа: ${body}`);
    error.statusCode = 502;
    throw error;
  }

  return { accepted: [to] };
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (hasResendConfig()) {
    return sendWithResend({ from, to, subject, text, html });
  }

  if (hasSendGridConfig()) {
    return sendWithSendGridApi({ from, to, subject, text, html });
  }

  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error("Имэйл үйлчилгээ тохируулагдаагүй байна. RESEND_API_KEY, SENDGRID_API_KEY эсвэл SMTP_USER/SMTP_PASS шаардлагатай.");
    error.statusCode = 503;
    throw error;
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;
