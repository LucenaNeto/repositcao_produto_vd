import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // Para o Drizzle Studio encontrar o arquivo:
    url: "file:./data/db.sqlite",
  },
  strict: true,
});
