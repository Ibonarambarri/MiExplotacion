import { db } from "@/lib/db";
import {
  transactions,
  sheep,
  rabbits,
  lambs,
  transactionCategoryEnum,
  transactionTypeEnum,
} from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import type { Transaction } from "@/db/schema";
import { nowParts } from "@/lib/dates";

export type TxType = (typeof transactionTypeEnum.enumValues)[number];
export type TxCategory = (typeof transactionCategoryEnum.enumValues)[number];

export interface TxFilters {
  year?: number;
  month?: number; // 1-12; sin month → todo el año
  type?: TxType | "all";
  category?: TxCategory | "all";
  sheepId?: number;
  rabbitId?: number;
  /** Texto libre a buscar en la descripción. */
  q?: string;
}

export interface TransactionWithAnimal extends Transaction {
  sheepLabel: string | null;
  rabbitLabel: string | null;
  lambLabel: string | null;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildDateConds(year?: number, month?: number) {
  const conds = [];
  if (year && month) {
    const mm = String(month).padStart(2, "0");
    conds.push(gte(transactions.date, `${year}-${mm}-01`));
    conds.push(
      lte(
        transactions.date,
        `${year}-${mm}-${String(lastDayOfMonth(year, month)).padStart(2, "0")}`,
      ),
    );
  } else if (year) {
    conds.push(gte(transactions.date, `${year}-01-01`));
    conds.push(lte(transactions.date, `${year}-12-31`));
  }
  return conds;
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
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
  const q = filters.q?.trim();
  if (q) conds.push(ilike(transactions.description, `%${escapeLike(q)}%`));

  const rows = await db
    .select({
      tx: transactions,
      sheepNickname: sheep.nickname,
      sheepTagId: sheep.tagId,
      rabbitNickname: rabbits.nickname,
      rabbitTagId: rabbits.tagId,
      lambNickname: lambs.nickname,
    })
    .from(transactions)
    .leftJoin(sheep, eq(sheep.id, transactions.sheepId))
    .leftJoin(rabbits, eq(rabbits.id, transactions.rabbitId))
    .leftJoin(lambs, eq(lambs.id, transactions.lambId))
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
    lambLabel:
      r.tx.lambId !== null
        ? r.lambNickname
          ? `Cordero ${r.lambNickname}`
          : "Cordero"
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
 * Devuelve 12 meses consecutivos con ingresos y gastos. Por defecto termina en
 * el mes actual (zona horaria de la explotación); `end` permite fijar el último.
 */
export async function getMonthlyBuckets(end?: {
  year: number;
  month: number;
}): Promise<MonthBucket[]> {
  const { year: endYear, month: endMonth } = end ?? nowParts();

  const months: { year: number; month: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const idx = endYear * 12 + (endMonth - 1) - i;
    months.push({ year: Math.floor(idx / 12), month: (idx % 12) + 1 });
  }
  const first = months[0];
  const last = months[11];
  const fromIso = `${first.year}-${String(first.month).padStart(2, "0")}-01`;
  const toIso = `${last.year}-${String(last.month).padStart(2, "0")}-${String(
    lastDayOfMonth(last.year, last.month),
  ).padStart(2, "0")}`;

  const rows = await db
    .select({
      year: sql<string>`extract(year from ${transactions.date})::int`,
      month: sql<string>`extract(month from ${transactions.date})::int`,
      ingresos: sql<string>`coalesce(sum(case when ${transactions.type} = 'ingreso' then ${transactions.amountEur} else 0 end), 0)`,
      gastos: sql<string>`coalesce(sum(case when ${transactions.type} = 'gasto' then ${transactions.amountEur} else 0 end), 0)`,
    })
    .from(transactions)
    .where(and(gte(transactions.date, fromIso), lte(transactions.date, toIso)))
    .groupBy(
      sql`extract(year from ${transactions.date})`,
      sql`extract(month from ${transactions.date})`,
    )
    .orderBy(
      asc(sql`extract(year from ${transactions.date})`),
      asc(sql`extract(month from ${transactions.date})`),
    );

  return months.map(({ year, month }) => {
    const found = rows.find(
      (r) => Number(r.year) === year && Number(r.month) === month,
    );
    return {
      year,
      month,
      ingresos: Number(found?.ingresos ?? 0),
      gastos: Number(found?.gastos ?? 0),
    };
  });
}

export interface CategoryTotal {
  type: TxType;
  category: TxCategory;
  total: number;
  count: number;
}

/** Totales por tipo y categoría del periodo, ordenados de mayor a menor. */
export async function getCategoryBreakdown(
  filters: Pick<TxFilters, "year" | "month">,
): Promise<CategoryTotal[]> {
  const conds = buildDateConds(filters.year, filters.month);
  const rows = await db
    .select({
      type: transactions.type,
      category: transactions.category,
      total: sql<string>`coalesce(sum(${transactions.amountEur}), 0)`,
      count: sql<string>`count(*)::int`,
    })
    .from(transactions)
    .where(conds.length ? and(...conds) : undefined)
    .groupBy(transactions.type, transactions.category);

  return rows
    .map((r) => ({
      type: r.type,
      category: r.category,
      total: Number(r.total),
      count: Number(r.count),
    }))
    .sort((a, b) => b.total - a.total);
}
