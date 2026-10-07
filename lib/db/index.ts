import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no definida en el entorno");
}

const isProd = process.env.NODE_ENV === "production";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForPg = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
  _pglite?: PGlite;
};

function createDb(url: string): Db {
  // Modo demo/local sin servidor: DATABASE_URL=pglite://./.data/mi-explotacion
  if (url.startsWith("pglite://")) {
    const dir = url.slice("pglite://".length);
    const client = globalForPg._pglite ?? new PGlite(dir);
    globalForPg._pglite = client;
    const pgliteDb = drizzlePglite(client, { schema });
    // postgres-js devuelve las filas como array; PGlite, { rows }. Se iguala
    // para que `db.execute` se comporte igual en los dos modos.
    const execute = pgliteDb.execute.bind(pgliteDb);
    Object.assign(pgliteDb, {
      execute: async (query: Parameters<typeof execute>[0]) => {
        const result = await execute(query);
        return Object.assign([...result.rows], result);
      },
    });
    return pgliteDb as unknown as Db;
  }

  const client =
    globalForPg._pg ??
    postgres(url, {
      prepare: false,
      max: isProd ? 10 : 5,
    });
  if (!isProd) globalForPg._pg = client;
  return drizzle(client, { schema });
}

let instance: Db | undefined;

/**
 * Conexión perezosa: se crea en la primera consulta, no al importar el módulo
 * (así el build no abre conexiones ni bloquea el directorio de PGlite).
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= createDb(connectionString);
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
export { schema };
