import { db } from "@/lib/db";
import {
  transactions,
  sheep,
  rabbits,
  transactionCategoryEnum,
  transactionTypeEnum,
} from "@/db/schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Transaction } from "@/db/schema";

export type TxType = (typeof transactionTypeEnum.enumValues)[number];
export type TxCategory = (typeof transactionCategoryEnum.enumValues)[number];

export interface TxFilters {
  year?: number;
  month?: number; // 1-12; sin month → todo el año
  type?: TxType | "all";
  category?: TxCategory | "all";
  sheepId?: number;
  rabbitId?: number;
}

interface TransactionWithAnimal extends Transaction {
  sheepLabel: string | null;
  rabbitLabel: string | null;
}

function buildDateConds(year?: number, month?: number) {
  const conds = [];
  if (year && month) {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    conds.push(gte(transactions.date, from));
    conds.push(lte(transactions.date, to));
  } else if (year) {
    conds.push(gte(transactions.date, `${year}-01-01`));
    conds.push(lte(transactions.date, `${year}-12-31`));
  }
  return conds;
}

export async function listTransactions(
  filters: TxFilters = {},
): Promise<TransactionWithAnimal[]> {
  const conds = [...buildDateConds(filters.year, filters.month)];
  if (filters.type && filters.type !== "all") {
    conds.push(eq(transactions.type, filters.type));
  }
  if (filters.category && filters.category !== "all") {
    conds.push(eq(transactions.category, filters.category));
  }
  if (filters.sheepId) conds.push(eq(transactions.sheepId, filters.sheepId));
  if (filters.rabbitId) conds.push(eq(transactions.rabbitId, filters.rabbitId));

  const rows = await db
    .select({
      tx: transactions,
      sheepNickname: sheep.nickname,
      sheepTagId: sheep.tagId,
      rabbitNickname: rabbits.nickname,
      rabbitTagId: rabbits.tagId,
    })
    .from(transactions)
    .leftJoin(sheep, eq(sheep.id, transactions.sheepId))
    .leftJoin(rabbits, eq(rabbits.id, transactions.rabbitId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(transactions.date), desc(transactions.id));

  return rows.map((r) => ({
    ...r.tx,
    sheepLabel:
      r.tx.sheepId !== null
        ? r.sheepNickname || r.sheepTagId || `#${r.tx.sheepId}`
        : null,
    rabbitLabel:
      r.tx.rabbitId !== null
        ? r.rabbitNickname || r.rabbitTagId || `#${r.tx.rabbitId}`
        : null,
  }));
}

export async function getTransactionById(
  id: number,
): Promise<Transaction | null> {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export interface Balance {
  ingresos: number;
  gastos: number;
  balance: number;
}

export async function getBalance(filters: TxFilters): Promise<Balance> {
  const conds = [...buildDateConds(filters.year, filters.month)];

  const [row] = await db
    .select({
      ingresos: sql<string>`coalesce(sum(case when ${transactions.type} = 'ingreso' then ${transactions.amountEur} else 0 end), 0)`,
      gastos: sql<string>`coalesce(sum(case when ${transactions.type} = 'gasto' then ${transactions.amountEur} else 0 end), 0)`,
    })
    .from(transactions)
    .where(conds.length ? and(...conds) : undefined);

  const ingresos = Number(row?.ingresos ?? 0);
  const gastos = Number(row?.gastos ?? 0);
  return { ingresos, gastos, balance: ingresos - gastos };
}

export interface MonthBucket {
  year: number;
  month: number; // 1-12
  ingresos: number;
  gastos: number;
}

/**
 * Devuelve los últimos 12 meses (incluido el mes actual) con ingresos y gastos.
 */
export async function getMonthlyBuckets(): Promise<MonthBucket[]> {
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;
  // 12 meses atrás (inclusive)
  const fromDate = new Date(startYear, startMonth - 12, 1);
  const fromIso = `${fromDate.getFullYear()}-${String(
    fromDate.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  const rows = await db
    .select({
      year: sql<string>`extract(year from ${transactions.date})::int`,
      month: sql<string>`extract(month from ${transactions.date})::int`,
      ingresos: sql<string>`coalesce(sum(case when ${transactions.type} = 'ingreso' then ${transactions.amountEur} else 0 end), 0)`,
      gastos: sql<string>`coalesce(sum(case when ${transactions.type} = 'gasto' then ${transactions.amountEur} else 0 end), 0)`,
    })
    .from(transactions)
    .where(gte(transactions.date, fromIso))
    .groupBy(
      sql`extract(year from ${transactions.date})`,
      sql`extract(month from ${transactions.date})`,
    )
    .orderBy(
      asc(sql`extract(year from ${transactions.date})`),
      asc(sql`extract(month from ${transactions.date})`),
    );

  // Construye 12 buckets, rellenando los meses sin datos con 0
  const buckets: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(startYear, startMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const found = rows.find(
      (r) => Number(r.year) === y && Number(r.month) === m,
    );
    buckets.push({
      year: y,
      month: m,
      ingresos: Number(found?.ingresos ?? 0),
      gastos: Number(found?.gastos ?? 0),
    });
  }
  return buckets;
}
