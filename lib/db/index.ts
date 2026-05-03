import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no definida en el entorno");
}

const isProd = process.env.NODE_ENV === "production";

const globalForPg = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
};

const client =
  globalForPg._pg ??
  postgres(connectionString, {
    prepare: false,
    max: isProd ? 10 : 5,
  });

if (!isProd) globalForPg._pg = client;

export const db = drizzle(client, { schema });
export { schema };
