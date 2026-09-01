const dns = require("node:dns");
const nodemailer = require("nodemailer");

dns.setDefaultResultOrder("ipv4first");

// Neither `dns.setDefaultResultOrder("ipv4first")` nor nodemailer's own
// `family: 4` / custom `lookup` option reliably kept the socket layer off
// IPv6 here - it kept trying an AAAA address and failing with ENETUNREACH
// (Render's outbound network can't route IPv6) regardless of implicit-TLS
// vs STARTTLS. Resolving the A record ourselves and connecting to that
// literal IP sidesteps whatever is re-introducing IPv6 further down the
// stack. `tls.servername` keeps SNI/cert validation targeting the real
// hostname even though `host` is now an IP.
async function resolveIpv4Host(hostname) {
  try {
    const addresses = await dns.promises.resolve4(hostname);
    if (addresses[0]) return addresses[0];
  } catch (error) {
    console.warn(`[sendEmail] IPv4 resolve failed for ${hostname}, falling back to hostname:`, error.message);
  }
  return hostname;
}

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

function hasBrevoConfig() {
  return Boolean(process.env.BREVO_API_KEY);
}

function hasSendGridConfig() {
  return Boolean(process.env.SENDGRID_API_KEY);
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function createSendGridTransporter() {
  const hostname = "smtp.sendgrid.net";
  return nodemailer.createTransport({
    host: await resolveIpv4Host(hostname),
    port: 587,
    secure: false,
    requireTLS: true,
    tls: { servername: hostname },
    dnsTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

async function createSmtpTransporter() {
  const hostname = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const useImplicitTls = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: await resolveIpv4Host(hostname),
    port,
    secure: useImplicitTls,
    requireTLS: !useImplicitTls,
    tls: { servername: hostname },
    dnsTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function createTransporter() {
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

// Brevo (formerly Sendinblue): unlike Resend/SendGrid, its free tier lets a
// single verified sender email (no DNS/domain ownership needed) send to any
// recipient - no sandbox-mode recipient restriction, no separate "trial
// credit" gate blocking real sends. https://api.brevo.com/v3/smtp/email
async function sendWithBrevo({ from, to, subject, text, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: "UBTable" },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Brevo имэйл илгээхэд алдаа гарлаа: ${body}`);
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
  if (hasResendConfig()) {
    const from = process.env.EMAIL_FROM;

    if (!from || from === "onboarding@resend.dev" || from.endsWith("@gmail.com")) {
      const error = new Error("Resend ашиглан бүх хэрэглэгч рүү код илгээхийн тулд verified domain sender хэрэгтэй. Render дээр EMAIL_FROM=noreply@your-domain.mn гэж Resend дээр баталгаажсан domain-ийн email тавина уу.");
      error.statusCode = 503;
      throw error;
    }

    return sendWithResend({ from, to, subject, text, html });
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (hasBrevoConfig()) {
    return sendWithBrevo({ from, to, subject, text, html });
  }

  if (hasSendGridConfig()) {
    return sendWithSendGridApi({ from, to, subject, text, html });
  }

  const transporter = await createTransporter();

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
