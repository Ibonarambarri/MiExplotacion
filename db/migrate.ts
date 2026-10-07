/**
 * Aplica las migraciones SQL de db/migrations en orden.
 * Todas son aditivas e idempotentes: no borran ni modifican datos existentes.
 *
 *   pnpm db:migrate
 */
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL no definida.");
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const dir = join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  try {
    for (const file of files) {
      process.stdout.write(`→ ${file} … `);
      await sql.unsafe(readFileSync(join(dir, file), "utf8"));
      console.log("ok");
    }
    console.log("Migraciones aplicadas. Tus datos existentes no se han tocado.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("\nError aplicando migraciones:", err);
  process.exit(1);
});
