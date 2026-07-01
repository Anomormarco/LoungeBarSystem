function isGmail(email) {
  return /^[^\s@]+@gmail\.com$/i.test(String(email || "").trim());
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(email || "").trim());
}

function isStrongPassword(password) {
  const value = String(password || "");
  return value.length >= 6 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function passwordRuleMessage() {
  return "Нууц үг хамгийн багадаа 6 тэмдэгттэй, том үсэг, жижиг үсэг болон тусгай тэмдэгт агуулсан байх ёстой.";
}

module.exports = {
  isEmail,
  isGmail,
  isStrongPassword,
  passwordRuleMessage,
};

