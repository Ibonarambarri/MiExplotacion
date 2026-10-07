import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato YYYY-MM-DD)");

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "Fecha inválida",
  });

const optionalText = (max = 1000) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined));

const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Importe inválido (máx 2 decimales)");

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v : undefined))
  .refine((v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(v), {
    message: "Número inválido (máx 2 decimales)",
  });

const optionalInt = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? Number(v) : undefined))
  .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0), {
    message: "Número entero inválido",
  });

// ─── Animal status ────────────────────────────────────────────────────────
export const animalStatus = z.enum([
  "activo",
  "vendido",
  "muerto",
  "sacrificado",
]);
export type AnimalStatus = z.infer<typeof animalStatus>;

export const animalStatusLabels: Record<AnimalStatus, string> = {
  activo: "Activo",
  vendido: "Vendido",
  muerto: "Muerto",
  sacrificado: "Sacrificado",
};

// ─── Sheep / Rabbit base ──────────────────────────────────────────────────
export const animalSchema = z
  .object({
    tagId: z
      .string()
      .min(1, "Crotal obligatorio")
      .max(32, "Máximo 32 caracteres")
      .transform((v) => v.trim()),
    nickname: optionalText(64),
    birthDate: optionalDate,
    status: animalStatus,
    deathDate: optionalDate,
    deathCause: optionalText(),
    notes: optionalText(),
    // Genealogía: madre dentro del rebaño (id de la misma especie).
    motherId: optionalInt,
  })
  .refine(
    (d) => {
      if (d.status === "muerto" || d.status === "sacrificado") {
        return !!d.deathDate;
      }
      return true;
    },
    {
      message: "Indica la fecha de baja para animales muertos o sacrificados",
      path: ["deathDate"],
    },
  );

export type AnimalInput = z.infer<typeof animalSchema>;

// ─── Vaccine ──────────────────────────────────────────────────────────────
export const vaccineSchema = z.object({
  date: dateString,
  type: z.string().min(1, "Tipo obligatorio").max(128),
  dose: optionalText(64),
  nextDoseDate: optionalDate,
  vet: optionalText(128),
  notes: optionalText(),
});

export type VaccineInput = z.infer<typeof vaccineSchema>;

// ─── Disease ──────────────────────────────────────────────────────────────
export const diseaseSchema = z
  .object({
    startDate: dateString,
    name: z.string().min(1, "Nombre obligatorio").max(128),
    treatment: optionalText(),
    medication: optionalText(128),
    dose: optionalText(64),
    frequency: optionalText(64),
    resolved: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === "true" || v === "on"),
    resolvedDate: optionalDate,
    notes: optionalText(),
  })
  .refine((d) => !d.resolved || !!d.resolvedDate, {
    message: "Indica la fecha de resolución",
    path: ["resolvedDate"],
  });

export type DiseaseInput = z.infer<typeof diseaseSchema>;

// ─── Sheep breeding ───────────────────────────────────────────────────────
export const sheepBreedingSchema = z.object({
  inseminationDate: dateString,
  expectedBirthDate: optionalDate, // se autocalcula si vacío
  actualBirthDate: optionalDate,
  sire: optionalText(64),
  notes: optionalText(),
});

export type SheepBreedingInput = z.infer<typeof sheepBreedingSchema>;

// ─── Lamb ─────────────────────────────────────────────────────────────────
export const lambGender = z.enum(["macho", "hembra"]).optional();

export const lambStatus = z.enum([
  "vivo",
  "sacrificado",
  "muerto_natural",
  "vendido",
]);

export const lambStatusLabels: Record<z.infer<typeof lambStatus>, string> = {
  vivo: "Vivo",
  sacrificado: "Sacrificado",
  muerto_natural: "Muerto natural",
  vendido: "Vendido",
};

export const lambSchema = z.object({
  gender: lambGender,
  nickname: optionalText(64),
  status: lambStatus.default("vivo"),
  slaughterDate: optionalDate,
  deadWeightKg: optionalDecimal,
  saleDate: optionalDate,
  salePriceEur: optionalDecimal,
  notes: optionalText(),
});

export type LambInput = z.infer<typeof lambSchema>;

// ─── Rabbit breeding & litter ─────────────────────────────────────────────
export const rabbitBreedingSchema = z.object({
  inseminationDate: dateString,
  expectedBirthDate: optionalDate,
  actualBirthDate: optionalDate,
  sire: optionalText(64),
  notes: optionalText(),
});
export type RabbitBreedingInput = z.infer<typeof rabbitBreedingSchema>;

export const litterSchema = z.object({
  initialUnits: optionalInt,
  currentUnits: optionalInt,
  naturalDeaths: optionalInt,
  averageWeightKg: optionalDecimal,
  slaughterDate: optionalDate,
  slaughteredUnits: optionalInt,
  saleAmountEur: optionalDecimal,
  notes: optionalText(),
});
export type LitterInput = z.infer<typeof litterSchema>;

// ─── Transaction ──────────────────────────────────────────────────────────
export const transactionType = z.enum(["ingreso", "gasto"]);
export const transactionCategory = z.enum([
  "pienso",
  "veterinario",
  "vacunas",
  "venta_animal",
  "venta_carne",
  "equipamiento",
  "otros",
]);
export const animalKind = z.enum(["oveja", "coneja"]);

export const transactionCategoryLabels: Record<
  z.infer<typeof transactionCategory>,
  string
> = {
  pienso: "Pienso",
  veterinario: "Veterinario",
  vacunas: "Vacunas",
  venta_animal: "Venta animal",
  venta_carne: "Venta carne",
  equipamiento: "Equipamiento",
  otros: "Otros",
};

export const transactionSchema = z.object({
  date: dateString,
  type: transactionType,
  category: transactionCategory,
  amountEur: decimalString,
  description: optionalText(),
  animalKind: animalKind.optional(),
  sheepId: optionalInt,
  rabbitId: optionalInt,
});

export type TransactionInput = z.infer<typeof transactionSchema>;

// ─── Pesajes ──────────────────────────────────────────────────────────────
/** Acepta "12,5" o "12.5". */
const kgString = z
  .string()
  .transform((v) => v.trim().replace(",", "."))
  .refine((v) => /^\d{1,4}(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
    message: "Peso inválido (kg, máx 2 decimales)",
  });

export const weightSchema = z.object({
  date: dateString,
  weightKg: kgString,
  notes: optionalText(),
});
export type WeightInput = z.infer<typeof weightSchema>;

// ─── Matanza de camada ────────────────────────────────────────────────────
export const litterSlaughterSchema = z.object({
  slaughterDate: dateString,
  slaughteredUnits: optionalInt,
  saleAmountEur: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim().replace(",", ".") : undefined))
    .refine((v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(v), {
      message: "Importe inválido (máx 2 decimales)",
    }),
});

// ─── Pasar cordera al rebaño ──────────────────────────────────────────────
export const promoteLambSchema = z.object({
  tagId: z
    .string()
    .min(1, "Crotal obligatorio")
    .max(32, "Máximo 32 caracteres")
    .transform((v) => v.trim()),
  nickname: optionalText(64),
});

// ─── FormData → object helper ─────────────────────────────────────────────
export function fdObject(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") obj[k] = v;
  }
  return obj;
}

export function flattenZodError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}
