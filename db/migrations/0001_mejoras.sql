-- Mi Explotación · migración "mejoras"
-- SOLO ADITIVA: añade columnas opcionales y tablas nuevas.
-- No borra, no renombra y no modifica ningún dato existente.
-- Es idempotente: se puede ejecutar varias veces sin efectos.

BEGIN;

-- Genealogía y fotos
ALTER TABLE "sheep" ADD COLUMN IF NOT EXISTS "mother_id" integer;
ALTER TABLE "sheep" ADD COLUMN IF NOT EXISTS "photo" text;
ALTER TABLE "sheep" ADD COLUMN IF NOT EXISTS "photo_thumb" text;
ALTER TABLE "rabbits" ADD COLUMN IF NOT EXISTS "mother_id" integer;
ALTER TABLE "rabbits" ADD COLUMN IF NOT EXISTS "photo" text;
ALTER TABLE "rabbits" ADD COLUMN IF NOT EXISTS "photo_thumb" text;

-- Semental en crianzas
ALTER TABLE "sheep_breedings" ADD COLUMN IF NOT EXISTS "sire" varchar(64);
ALTER TABLE "rabbit_breedings" ADD COLUMN IF NOT EXISTS "sire" varchar(64);

-- Corderas que pasan al rebaño / importe de matanza
ALTER TABLE "lambs" ADD COLUMN IF NOT EXISTS "promoted_sheep_id" integer;
ALTER TABLE "litters" ADD COLUMN IF NOT EXISTS "sale_amount_eur" numeric(10, 2);

-- Movimientos generados automáticamente
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "lamb_id" integer;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "litter_id" integer;

-- Tablas nuevas
CREATE TABLE IF NOT EXISTS "weight_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" date NOT NULL,
  "weight_kg" numeric(6, 2) NOT NULL,
  "sheep_id" integer,
  "rabbit_id" integer,
  "lamb_id" integer,
  "litter_id" integer,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "weight_records_date_idx" ON "weight_records" ("date");

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE ("endpoint")
);

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Claves foráneas (nombres iguales a los que genera Drizzle)
DO $$ BEGIN
  ALTER TABLE "sheep" ADD CONSTRAINT "sheep_mother_id_sheep_id_fk" FOREIGN KEY ("mother_id") REFERENCES "sheep"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "rabbits" ADD CONSTRAINT "rabbits_mother_id_rabbits_id_fk" FOREIGN KEY ("mother_id") REFERENCES "rabbits"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "lambs" ADD CONSTRAINT "lambs_promoted_sheep_id_sheep_id_fk" FOREIGN KEY ("promoted_sheep_id") REFERENCES "sheep"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_lamb_id_lambs_id_fk" FOREIGN KEY ("lamb_id") REFERENCES "lambs"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_litter_id_litters_id_fk" FOREIGN KEY ("litter_id") REFERENCES "litters"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_sheep_id_sheep_id_fk" FOREIGN KEY ("sheep_id") REFERENCES "sheep"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_rabbit_id_rabbits_id_fk" FOREIGN KEY ("rabbit_id") REFERENCES "rabbits"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_lamb_id_lambs_id_fk" FOREIGN KEY ("lamb_id") REFERENCES "lambs"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_litter_id_litters_id_fk" FOREIGN KEY ("litter_id") REFERENCES "litters"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
