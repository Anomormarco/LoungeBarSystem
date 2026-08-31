import "dotenv/config";
import { defineConfig } from "prisma/config";

function databaseUrl() {
  const url = process.env.DATABASE_URL || "postgresql://loungebar_user:loungebar_password@localhost:5432/loungebar";

  if (process.env.DATABASE_REQUIRE_SSL !== "true") {
    return url;
  }

  const parsedUrl = new URL(url);
  if (!parsedUrl.searchParams.has("sslmode")) {
    parsedUrl.searchParams.set("sslmode", process.env.DATABASE_SSL_MODE || "require");
  }

  return parsedUrl.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl(),
  },
});
