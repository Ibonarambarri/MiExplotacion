import { useId } from "react";
import { daysBetweenIso, MONTHS_ES_SHORT } from "@/lib/dates";
import type { WeightPoint } from "@/lib/queries/weights";

/**
 * Gráfica de línea ligera en SVG (sin librerías): eje X por fecha real,
 * eje Y con margen, área suave bajo la línea y puntos.
 */
const W = 320;
const H = 150;
const PAD = { top: 12, right: 12, bottom: 22, left: 34 };

const kgFmt = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ES_SHORT[m - 1]}`;
};

export function WeightChart({ points }: { points: WeightPoint[] }) {
  const gid = `wc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (points.length === 0) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const span = Math.max(1, daysBetweenIso(first.date, last.date));
  const ws = points.map((p) => p.weightKg);
  let min = Math.min(...ws);
  let max = Math.max(...ws);
  const pad = Math.max((max - min) * 0.15, 0.5);
  min = Math.max(0, min - pad);
  max = max + pad;

  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (iso: string) =>
    points.length === 1 ? PAD.left + iw / 2 : PAD.left + (daysBetweenIso(first.date, iso) / span) * iw;
  const y = (kg: number) => PAD.top + (1 - (kg - min) / (max - min)) * ih;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(" ");
  const area = `${line} L${x(last.date).toFixed(1)},${PAD.top + ih} L${x(first.date).toFixed(1)},${PAD.top + ih} Z`;
  const ticks = [max, (max + min) / 2, min];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Evolución del peso: de ${kgFmt(first.weightKg)} kg el ${shortDate(first.date)} a ${kgFmt(last.weightKg)} kg el ${shortDate(last.date)}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <text
            x={PAD.left - 6}
            y={y(t) + 3.5}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted-foreground)"
            className="tabular"
          >
            {kgFmt(t)}
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={area} fill={`url(#${gid})`} />}
      {points.length > 1 && (
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((p, i) => (
        <circle
          key={p.id}
          cx={x(p.date)}
          cy={y(p.weightKg)}
          r={i === points.length - 1 ? 4 : 3}
          fill={i === points.length - 1 ? "var(--primary)" : "var(--card)"}
          stroke="var(--primary)"
          strokeWidth="2"
        />
      ))}
      <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--muted-foreground)">
        {shortDate(first.date)}
      </text>
      {points.length > 1 && (
        <text x={W - PAD.right} y={H - 6} fontSize="10" textAnchor="end" fill="var(--muted-foreground)">
          {shortDate(last.date)}
        </text>
      )}
    </svg>
  );
}
