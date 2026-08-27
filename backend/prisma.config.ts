import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // generate does not connect to the database; this fallback lets
    // `npm install` / `prisma generate` succeed before a local .env exists.
    // Runtime queries still use process.env.DATABASE_URL from the app.
    url: process.env.DATABASE_URL || "postgresql://127.0.0.1:5432/postgres",
  },
});