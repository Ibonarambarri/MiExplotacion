import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL no definida.");
    process.exit(1);
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  console.log("Insertando datos de prueba…");

  await db.insert(schema.sheep).values([
    {
      tagId: "ES-0001",
      nickname: "Luisa",
      birthDate: "2023-04-12",
      status: "activo",
      notes: "Madre experimentada.",
    },
    {
      tagId: "ES-0002",
      nickname: "Margarita",
      birthDate: "2024-02-03",
      status: "activo",
    },
  ]);

  await db.insert(schema.rabbits).values([
    {
      tagId: "C-001",
      nickname: "Coca",
      birthDate: "2024-09-10",
      status: "activo",
    },
  ]);

  await db.insert(schema.transactions).values([
    {
      date: "2026-04-15",
      type: "gasto",
      category: "pienso",
      amountEur: "45.20",
      description: "Saco de pienso 25kg",
    },
    {
      date: "2026-04-20",
      type: "ingreso",
      category: "venta_carne",
      amountEur: "120.00",
      description: "Venta cordero",
    },
  ]);

  console.log("Listo.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
