import { useState } from "react";

// Colores de mi paleta: azul como color base (serie única, nunca necesito distinguir categorías aquí).
const INK_PRIMARY = "#0b0b0b";
const INK_SECONDARY = "#52514e";
const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";
const SURFACE = "#fcfcfb";
const SEQUENTIAL = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];

const CHART_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

type Point = { label: string; value: number };

/** Dibujo una serie de tiempo: una sola línea, 2px, con un punto final destacado. */
export function TimeseriesChart({ data, title }: { data: Point[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };

  if (data.length === 0) {
    return <EmptyChart title={title} />;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const x = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const y = (v: number) => padding.top + innerH - (v / maxVal) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const lastPoint = data[data.length - 1];

  return (
    <div style={{ background: SURFACE, border: "1px solid " + GRIDLINE, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: CHART_FONT, fontSize: 13, color: INK_SECONDARY, marginBottom: 8 }}>{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", fontFamily: CHART_FONT }}>
        {/* Gridlines horizontales, recesivas */}
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={padding.left} x2={width - padding.right} y1={padding.top + innerH * (1 - f)} y2={padding.top + innerH * (1 - f)} stroke={GRIDLINE} strokeWidth={1} />
        ))}
        <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fontSize={11} fill={INK_MUTED}>{Math.round(maxVal)}</text>
        <text x={padding.left - 8} y={padding.top + innerH} textAnchor="end" fontSize={11} fill={INK_MUTED}>0</text>

        <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Punto final destacado, con anillo de superficie */}
        <circle cx={x(data.length - 1)} cy={y(lastPoint.value)} r={5} fill="#2a78d6" stroke={SURFACE} strokeWidth={2} />
        <text x={x(data.length - 1)} y={y(lastPoint.value) - 10} textAnchor="end" fontSize={11} fill={INK_PRIMARY} fontWeight={600}>
          {lastPoint.value}
        </text>

        {/* Capa de hover: un círculo invisible ancho por punto, más fácil de acertar que la línea */}
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={10} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
        {hover !== null && (
          <circle cx={x(hover)} cy={y(data[hover].value)} r={4} fill="#2a78d6" stroke={SURFACE} strokeWidth={2} />
        )}
      </svg>
      {hover !== null && (
        <div style={{ fontFamily: CHART_FONT, fontSize: 12, color: INK_SECONDARY }}>
          {data[hover].label}: <strong style={{ color: INK_PRIMARY }}>{data[hover].value} eventos</strong>
        </div>
      )}
    </div>
  );
}

/** Dibujo barras verticales con tono secuencial (para magnitud: más oscuro = mayor magnitud). */
export function MagnitudeDistributionChart({ data, title }: { data: Point[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 400;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };

  if (data.length === 0) {
    return <EmptyChart title={title} />;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barGap = 2;
  const barWidth = Math.min(32, innerW / data.length - barGap);

  return (
    <div style={{ background: SURFACE, border: "1px solid " + GRIDLINE, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: CHART_FONT, fontSize: 13, color: INK_SECONDARY, marginBottom: 8 }}>{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", fontFamily: CHART_FONT }}>
        <line x1={padding.left} x2={width - padding.right} y1={padding.top + innerH} y2={padding.top + innerH} stroke={BASELINE} strokeWidth={1} />
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * innerH;
          const bx = padding.left + i * (innerW / data.length) + (innerW / data.length - barWidth) / 2;
          const by = padding.top + innerH - barH;
          const color = SEQUENTIAL[Math.min(i, SEQUENTIAL.length - 1)];
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={bx} y={by} width={barWidth} height={Math.max(barH, 1)} rx={4} fill={color} />
              <text x={bx + barWidth / 2} y={padding.top + innerH + 16} textAnchor="middle" fontSize={11} fill={INK_MUTED}>{d.label}</text>
              {hover === i && (
                <text x={bx + barWidth / 2} y={by - 6} textAnchor="middle" fontSize={11} fill={INK_PRIMARY} fontWeight={600}>{d.value}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Dibujo un ranking horizontal (regiones con más actividad), un solo color, ordenado. */
export function RegionsRankingChart({ data, title }: { data: Point[]; title: string }) {
  const width = 400;
  const rowHeight = 28;
  const height = Math.max(data.length * rowHeight + 20, 60);
  const padding = { left: 140, right: 40 };

  if (data.length === 0) {
    return <EmptyChart title={title} />;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - padding.left - padding.right;

  return (
    <div style={{ background: SURFACE, border: "1px solid " + GRIDLINE, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: CHART_FONT, fontSize: 13, color: INK_SECONDARY, marginBottom: 8 }}>{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", fontFamily: CHART_FONT }}>
        {data.map((d, i) => {
          const barW = Math.max((d.value / maxVal) * innerW, 2);
          const y = 10 + i * rowHeight;
          return (
            <g key={d.label}>
              <text x={padding.left - 8} y={y + 14} textAnchor="end" fontSize={11} fill={INK_SECONDARY}>
                {d.label.length > 20 ? d.label.slice(0, 20) + "…" : d.label}
              </text>
              <rect x={padding.left} y={y} width={barW} height={16} rx={4} fill="#2a78d6" />
              <text x={padding.left + barW + 6} y={y + 13} fontSize={11} fill={INK_PRIMARY} fontWeight={600}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div style={{ background: SURFACE, border: "1px solid " + GRIDLINE, borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: CHART_FONT, fontSize: 13, color: INK_SECONDARY, marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: CHART_FONT, fontSize: 12, color: INK_MUTED }}>Todavía no tengo datos para graficar.</p>
    </div>
  );
}
