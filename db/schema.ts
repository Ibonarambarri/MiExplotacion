import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────
export const animalStatusEnum = pgEnum("animal_status", [
  "activo",
  "vendido",
  "muerto",
  "sacrificado",
]);

export const lambStatusEnum = pgEnum("lamb_status", [
  "vivo",
  "sacrificado",
  "muerto_natural",
  "vendido",
]);

export const lambGenderEnum = pgEnum("lamb_gender", ["macho", "hembra"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "ingreso",
  "gasto",
]);

export const transactionCategoryEnum = pgEnum("transaction_category", [
  "pienso",
  "veterinario",
  "vacunas",
  "venta_animal",
  "venta_carne",
  "equipamiento",
  "otros",
]);

export const animalKindEnum = pgEnum("animal_kind", ["oveja", "coneja"]);

// ─── Sheep ────────────────────────────────────────────────────────────────
export const sheep = pgTable(
  "sheep",
  {
    id: serial("id").primaryKey(),
    tagId: varchar("tag_id", { length: 32 }).notNull().unique(),
    nickname: varchar("nickname", { length: 64 }),
    birthDate: date("birth_date"),
    status: animalStatusEnum("status").notNull().default("activo"),
    deathDate: date("death_date"),
    deathCause: text("death_cause"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sheep_status_idx").on(t.status)],
);

export const sheepVaccines = pgTable("sheep_vaccines", {
  id: serial("id").primaryKey(),
  sheepId: integer("sheep_id")
    .notNull()
    .references(() => sheep.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  dose: varchar("dose", { length: 64 }),
  nextDoseDate: date("next_dose_date"),
  vet: varchar("vet", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sheepDiseases = pgTable("sheep_diseases", {
  id: serial("id").primaryKey(),
  sheepId: integer("sheep_id")
    .notNull()
    .references(() => sheep.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  treatment: text("treatment"),
  medication: varchar("medication", { length: 128 }),
  dose: varchar("dose", { length: 64 }),
  frequency: varchar("frequency", { length: 64 }),
  resolved: boolean("resolved").notNull().default(false),
  resolvedDate: date("resolved_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sheepBreedings = pgTable("sheep_breedings", {
  id: serial("id").primaryKey(),
  sheepId: integer("sheep_id")
    .notNull()
    .references(() => sheep.id, { onDelete: "cascade" }),
  inseminationDate: date("insemination_date").notNull(),
  expectedBirthDate: date("expected_birth_date").notNull(),
  actualBirthDate: date("actual_birth_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lambs = pgTable("lambs", {
  id: serial("id").primaryKey(),
  breedingId: integer("breeding_id")
    .notNull()
    .references(() => sheepBreedings.id, { onDelete: "cascade" }),
  gender: lambGenderEnum("gender"),
  nickname: varchar("nickname", { length: 64 }),
  status: lambStatusEnum("status").notNull().default("vivo"),
  slaughterDate: date("slaughter_date"),
  deadWeightKg: numeric("dead_weight_kg", { precision: 6, scale: 2 }),
  saleDate: date("sale_date"),
  salePriceEur: numeric("sale_price_eur", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Rabbits ──────────────────────────────────────────────────────────────
export const rabbits = pgTable(
  "rabbits",
  {
    id: serial("id").primaryKey(),
    tagId: varchar("tag_id", { length: 32 }).notNull().unique(),
    nickname: varchar("nickname", { length: 64 }),
    birthDate: date("birth_date"),
    status: animalStatusEnum("status").notNull().default("activo"),
    deathDate: date("death_date"),
    deathCause: text("death_cause"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("rabbits_status_idx").on(t.status)],
);

export const rabbitVaccines = pgTable("rabbit_vaccines", {
  id: serial("id").primaryKey(),
  rabbitId: integer("rabbit_id")
    .notNull()
    .references(() => rabbits.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  dose: varchar("dose", { length: 64 }),
  nextDoseDate: date("next_dose_date"),
  vet: varchar("vet", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rabbitDiseases = pgTable("rabbit_diseases", {
  id: serial("id").primaryKey(),
  rabbitId: integer("rabbit_id")
    .notNull()
    .references(() => rabbits.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  treatment: text("treatment"),
  medication: varchar("medication", { length: 128 }),
  dose: varchar("dose", { length: 64 }),
  frequency: varchar("frequency", { length: 64 }),
  resolved: boolean("resolved").notNull().default(false),
  resolvedDate: date("resolved_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rabbitBreedings = pgTable("rabbit_breedings", {
  id: serial("id").primaryKey(),
  rabbitId: integer("rabbit_id")
    .notNull()
    .references(() => rabbits.id, { onDelete: "cascade" }),
  inseminationDate: date("insemination_date").notNull(),
  expectedBirthDate: date("expected_birth_date").notNull(),
  actualBirthDate: date("actual_birth_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const litters = pgTable("litters", {
  id: serial("id").primaryKey(),
  breedingId: integer("breeding_id")
    .notNull()
    .references(() => rabbitBreedings.id, { onDelete: "cascade" }),
  initialUnits: integer("initial_units").notNull().default(0),
  currentUnits: integer("current_units").notNull().default(0),
  naturalDeaths: integer("natural_deaths").notNull().default(0),
  averageWeightKg: numeric("average_weight_kg", { precision: 6, scale: 2 }),
  slaughterDate: date("slaughter_date"),
  slaughteredUnits: integer("slaughtered_units"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Transactions ─────────────────────────────────────────────────────────
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    type: transactionTypeEnum("type").notNull(),
    category: transactionCategoryEnum("category").notNull(),
    amountEur: numeric("amount_eur", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    animalKind: animalKindEnum("animal_kind"),
    sheepId: integer("sheep_id").references(() => sheep.id, {
      onDelete: "set null",
    }),
    rabbitId: integer("rabbit_id").references(() => rabbits.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("transactions_date_idx").on(t.date),
    index("transactions_type_idx").on(t.type),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────
export const sheepRelations = relations(sheep, ({ many }) => ({
  vaccines: many(sheepVaccines),
  diseases: many(sheepDiseases),
  breedings: many(sheepBreedings),
  transactions: many(transactions),
}));

export const sheepVaccinesRelations = relations(sheepVaccines, ({ one }) => ({
  sheep: one(sheep, {
    fields: [sheepVaccines.sheepId],
    references: [sheep.id],
  }),
}));

export const sheepDiseasesRelations = relations(sheepDiseases, ({ one }) => ({
  sheep: one(sheep, {
    fields: [sheepDiseases.sheepId],
    references: [sheep.id],
  }),
}));

export const sheepBreedingsRelations = relations(
  sheepBreedings,
  ({ one, many }) => ({
    sheep: one(sheep, {
      fields: [sheepBreedings.sheepId],
      references: [sheep.id],
    }),
    lambs: many(lambs),
  }),
);

export const lambsRelations = relations(lambs, ({ one }) => ({
  breeding: one(sheepBreedings, {
    fields: [lambs.breedingId],
    references: [sheepBreedings.id],
  }),
}));

export const rabbitsRelations = relations(rabbits, ({ many }) => ({
  vaccines: many(rabbitVaccines),
  diseases: many(rabbitDiseases),
  breedings: many(rabbitBreedings),
  transactions: many(transactions),
}));

export const rabbitVaccinesRelations = relations(
  rabbitVaccines,
  ({ one }) => ({
    rabbit: one(rabbits, {
      fields: [rabbitVaccines.rabbitId],
      references: [rabbits.id],
    }),
  }),
);

export const rabbitDiseasesRelations = relations(
  rabbitDiseases,
  ({ one }) => ({
    rabbit: one(rabbits, {
      fields: [rabbitDiseases.rabbitId],
      references: [rabbits.id],
    }),
  }),
);

export const rabbitBreedingsRelations = relations(
  rabbitBreedings,
  ({ one, many }) => ({
    rabbit: one(rabbits, {
      fields: [rabbitBreedings.rabbitId],
      references: [rabbits.id],
    }),
    litters: many(litters),
  }),
);

export const littersRelations = relations(litters, ({ one }) => ({
  breeding: one(rabbitBreedings, {
    fields: [litters.breedingId],
    references: [rabbitBreedings.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  sheep: one(sheep, {
    fields: [transactions.sheepId],
    references: [sheep.id],
  }),
  rabbit: one(rabbits, {
    fields: [transactions.rabbitId],
    references: [rabbits.id],
  }),
}));

// ─── Inferred types ───────────────────────────────────────────────────────
export type Sheep = typeof sheep.$inferSelect;
export type NewSheep = typeof sheep.$inferInsert;
export type SheepVaccine = typeof sheepVaccines.$inferSelect;
export type NewSheepVaccine = typeof sheepVaccines.$inferInsert;
export type SheepDisease = typeof sheepDiseases.$inferSelect;
export type NewSheepDisease = typeof sheepDiseases.$inferInsert;
export type SheepBreeding = typeof sheepBreedings.$inferSelect;
export type NewSheepBreeding = typeof sheepBreedings.$inferInsert;
export type Lamb = typeof lambs.$inferSelect;
export type NewLamb = typeof lambs.$inferInsert;

export type Rabbit = typeof rabbits.$inferSelect;
export type NewRabbit = typeof rabbits.$inferInsert;
export type RabbitVaccine = typeof rabbitVaccines.$inferSelect;
export type NewRabbitVaccine = typeof rabbitVaccines.$inferInsert;
export type RabbitDisease = typeof rabbitDiseases.$inferSelect;
export type NewRabbitDisease = typeof rabbitDiseases.$inferInsert;
export type RabbitBreeding = typeof rabbitBreedings.$inferSelect;
export type NewRabbitBreeding = typeof rabbitBreedings.$inferInsert;
export type Litter = typeof litters.$inferSelect;
export type NewLitter = typeof litters.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
