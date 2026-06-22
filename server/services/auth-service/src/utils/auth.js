const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

function signToken(payload) {
  return jwt.sign(payload, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret());
}

async function verifyPassword(rawPassword, storedPassword) {
  if (!rawPassword || !storedPassword) return false;

  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(rawPassword, storedPassword);
  }

  return rawPassword === storedPassword;
}

module.exports = {
  signToken,
  verifyToken,
  verifyPassword,
};
