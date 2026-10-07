/**
 * Datos de DEMOSTRACIÓN (ficticios) para probar la app o hacer capturas.
 *
 *   pnpm db:seed
 *
 * ⚠️ No lo ejecutes contra una base de datos con datos reales: añade
 * animales y movimientos inventados. Por seguridad se niega a ejecutarse si
 * ya hay ovejas o conejas registradas.
 */
import "dotenv/config";
import { db, schema } from "../lib/db";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 864e5));
const inDays = (n: number) => iso(new Date(Date.now() + n * 864e5));

async function main() {
  const existing =
    (await db.select({ id: schema.sheep.id }).from(schema.sheep).limit(1)).length +
    (await db.select({ id: schema.rabbits.id }).from(schema.rabbits).limit(1)).length;
  if (existing > 0) {
    console.error("La base de datos ya tiene animales. No se insertan datos de demo.");
    process.exit(1);
  }

  console.log("Insertando datos de demostración…");

  const sheepNames = ["Luisa", "Margarita", "Canela", "Paloma", "Rosita", "Blanca", "Nube", "Trufa", "Estrella", "Lola", "Perla", "Mora"];
  const sheepRows = await db
    .insert(schema.sheep)
    .values(
      sheepNames.map((nickname, i) => {
        const status = i === 10 ? "vendido" : i === 11 ? "muerto" : "activo";
        return {
          tagId: `ES0480${1201 + i}`,
          nickname,
          birthDate: daysAgo(400 + i * 170),
          status: status as "activo" | "vendido" | "muerto",
          deathDate: status === "muerto" ? daysAgo(40) : null,
          notes: i === 0 ? "Madre muy buena, casi siempre gemelos." : null,
        };
      }),
    )
    .returning({ id: schema.sheep.id });
  const sheepIds = sheepRows.map((r) => r.id);

  const rabbitNames = ["Coca", "Pelusa", "Nieve", "Canica", "Bimba", "Luna", "Kira", "Chispa"];
  const rabbitRows = await db
    .insert(schema.rabbits)
    .values(
      rabbitNames.map((nickname, i) => ({
        tagId: `C-${101 + i}`,
        nickname,
        birthDate: daysAgo(200 + i * 60),
      })),
    )
    .returning({ id: schema.rabbits.id });
  const rabbitIds = rabbitRows.map((r) => r.id);

  const vax = ["Enterotoxemia", "Lengua azul", "Desparasitación"];
  await db.insert(schema.sheepVaccines).values(
    Array.from({ length: 9 }, (_, i) => ({
      sheepId: sheepIds[i],
      date: daysAgo(150 + i),
      type: vax[i % 3],
      dose: "2 ml",
      nextDoseDate: inDays(i * 4 - 3),
      vet: "Clínica veterinaria",
    })),
  );
  await db.insert(schema.rabbitVaccines).values(
    Array.from({ length: 5 }, (_, i) => ({
      rabbitId: rabbitIds[i],
      date: daysAgo(170),
      type: i % 2 ? "Mixomatosis" : "Hemorrágica vírica (VHD)",
      nextDoseDate: inDays(i * 6 + 2),
    })),
  );

  await db.insert(schema.sheepDiseases).values([
    { sheepId: sheepIds[3], startDate: daysAgo(4), name: "Cojera", treatment: "Limpieza de pezuña", medication: "Oxitetraciclina", dose: "5 ml", frequency: "Cada 48 h" },
    { sheepId: sheepIds[1], startDate: daysAgo(90), name: "Mamitis", resolved: true, resolvedDate: daysAgo(75) },
  ]);
  await db.insert(schema.rabbitDiseases).values([
    { rabbitId: rabbitIds[2], startDate: daysAgo(2), name: "Coriza", medication: "Enrofloxacino" },
  ]);

  // Crianzas de ovejas ya paridas, con corderos vendidos o sacrificados.
  for (let i = 0; i < 8; i++) {
    const birth = daysAgo(180 + i * 12);
    const [b] = await db
      .insert(schema.sheepBreedings)
      .values({ sheepId: sheepIds[i], inseminationDate: daysAgo(330 + i * 12), expectedBirthDate: birth, actualBirthDate: birth, sire: "Morueco 07" })
      .returning({ id: schema.sheepBreedings.id });
    const n = i % 3 === 0 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const sold = (i + k) % 2 === 0;
      const [lamb] = await db
        .insert(schema.lambs)
        .values({
          breedingId: b.id,
          gender: k ? "hembra" : "macho",
          status: sold ? "vendido" : "sacrificado",
          saleDate: sold ? daysAgo(100 + i) : null,
          salePriceEur: sold ? "95.00" : null,
          slaughterDate: sold ? null : daysAgo(95 + i),
          deadWeightKg: sold ? null : "11.40",
        })
        .returning({ id: schema.lambs.id });
      if (sold) {
        await db.insert(schema.transactions).values({
          date: daysAgo(100 + i),
          type: "ingreso",
          category: "venta_animal",
          amountEur: "95.00",
          description: "Venta cordero",
          animalKind: "oveja",
          sheepId: sheepIds[i],
          lambId: lamb.id,
        });
      }
    }
  }
  // Gestaciones en curso.
  for (let i = 0; i < 4; i++) {
    await db.insert(schema.sheepBreedings).values({
      sheepId: sheepIds[i],
      inseminationDate: daysAgo(140 - i * 9),
      expectedBirthDate: inDays(10 + i * 9),
      sire: "Morueco 07",
    });
  }

  for (let i = 0; i < 6; i++) {
    const birth = daysAgo(89 + i * 5);
    const [b] = await db
      .insert(schema.rabbitBreedings)
      .values({ rabbitId: rabbitIds[i], inseminationDate: daysAgo(120 + i * 5), expectedBirthDate: birth, actualBirthDate: birth })
      .returning({ id: schema.rabbitBreedings.id });
    await db.insert(schema.litters).values({
      breedingId: b.id,
      initialUnits: 8 + (i % 3),
      currentUnits: i < 3 ? 0 : 7,
      naturalDeaths: 1 + (i % 2),
      averageWeightKg: "2.10",
      slaughterDate: i < 3 ? daysAgo(20 + i) : null,
      slaughteredUnits: i < 3 ? 7 : null,
    });
  }
  for (let i = 0; i < 3; i++) {
    await db.insert(schema.rabbitBreedings).values({
      rabbitId: rabbitIds[i + 5],
      inseminationDate: daysAgo(20 + i * 3),
      expectedBirthDate: inDays(11 - i * 3),
    });
  }

  // Pesajes
  await db.insert(schema.weightRecords).values(
    Array.from({ length: 6 }, (_, k) => ({
      sheepId: sheepIds[0],
      date: daysAgo(300 - k * 55),
      weightKg: (58 + k * 1.6 + (k % 2 ? -0.8 : 0.5)).toFixed(2),
    })),
  );

  // Movimientos de los últimos 12 meses.
  const txs: (typeof schema.transactions.$inferInsert)[] = [];
  for (let m = 0; m < 12; m++) {
    const base = 30 * m;
    txs.push({ date: daysAgo(base + 3), type: "gasto", category: "pienso", amountEur: (140 + (m % 4) * 22).toFixed(2), description: "Pienso ovejas 500 kg", animalKind: "oveja" });
    txs.push({ date: daysAgo(base + 9), type: "gasto", category: "pienso", amountEur: (48 + (m % 3) * 6).toFixed(2), description: "Pienso conejas", animalKind: "coneja" });
    if (m % 2 === 0) txs.push({ date: daysAgo(base + 14), type: "ingreso", category: "venta_carne", amountEur: (180 + m * 15).toFixed(2), description: "Venta corderos carnicería" });
    if (m % 3 === 1) txs.push({ date: daysAgo(base + 18), type: "gasto", category: "veterinario", amountEur: "65.00", description: "Visita veterinaria", animalKind: "oveja", sheepId: sheepIds[m % 8] });
    if (m % 4 === 2) txs.push({ date: daysAgo(base + 21), type: "ingreso", category: "venta_animal", amountEur: "210.00", description: "Venta oveja de desvieje" });
  }
  txs.push({ date: daysAgo(2), type: "ingreso", category: "venta_carne", amountEur: "385.00", description: "Venta corderos lechales" });
  txs.push({ date: daysAgo(0), type: "gasto", category: "vacunas", amountEur: "42.50", description: "Vacunas enterotoxemia" });
  txs.push({ date: daysAgo(1), type: "gasto", category: "equipamiento", amountEur: "89.90", description: "Bebedero automático" });
  await db.insert(schema.transactions).values(txs);

  console.log("Listo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
