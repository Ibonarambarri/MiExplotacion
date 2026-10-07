import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL!;
// DATABASE_URL=pglite://<carpeta> → base de datos local embebida (modo demo).
const pglite = url?.startsWith("pglite://");

export default defineConfig({
  schema: "./db/schema.ts",
  // Las migraciones SQL escritas a mano viven en db/migrations (pnpm db:migrate);
  // lo que genere drizzle-kit va aparte para no mezclarlo.
  out: "./db/drizzle",
  dialect: "postgresql",
  ...(pglite
    ? { driver: "pglite" as const, dbCredentials: { url: url.slice("pglite://".length) } }
    : { dbCredentials: { url } }),
  strict: true,
  verbose: true,
});
