const path = require("path");
const dotenv = require("dotenv");

const envPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../../.env"),
  path.resolve(__dirname, "../../../../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "server/.env"),
];

let loaded = false;

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath, override: false });
  if (!result.error) loaded = true;
}

module.exports = { loaded };
