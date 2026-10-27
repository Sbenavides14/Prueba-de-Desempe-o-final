// Mis gráficos en SVG puro, sin librería externa. Misma paleta validada contra daltonismo
// que usaba en la versión anterior.
const CHART_INK_PRIMARY = "#0b0b0b";
const CHART_INK_SECONDARY = "#52514e";
const CHART_INK_MUTED = "#898781";
const CHART_GRIDLINE = "#e1e0d9";
const CHART_BASELINE = "#c3c2b7";
const CHART_SURFACE = "#fcfcfb";
const CHART_SEQUENTIAL = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];

function chartWrap(title, innerSvg) {
  return `
    <div style="background:${CHART_SURFACE};border:1px solid ${CHART_GRIDLINE};border-radius:8px;padding:12px">
      <div style="font-size:13px;color:${CHART_INK_SECONDARY};margin-bottom:8px">${title}</div>
      ${innerSvg}
    </div>`;
}

function emptyChart(title) {
  return chartWrap(title, `<p style="font-size:12px;color:${CHART_INK_MUTED};margin:0">Todavía no tengo datos para graficar.</p>`);
}

function renderTimeseriesChart(data, title) {
  if (!data.length) return emptyChart(title);
  const width = 600, height = 220, pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - pad.left - pad.right, innerH = height - pad.top - pad.bottom;
  const x = (i) => pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const y = (v) => pad.top + innerH - (v / maxVal) * innerH;
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const last = data[data.length - 1];

  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">`;
  [0, 0.5, 1].forEach((f) => {
    svg += `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + innerH * (1 - f)}" y2="${pad.top + innerH * (1 - f)}" stroke="${CHART_GRIDLINE}" stroke-width="1"/>`;
  });
  svg += `<text x="${pad.left - 8}" y="${pad.top + 4}" text-anchor="end" font-size="11" fill="${CHART_INK_MUTED}">${Math.round(maxVal)}</text>`;
  svg += `<text x="${pad.left - 8}" y="${pad.top + innerH}" text-anchor="end" font-size="11" fill="${CHART_INK_MUTED}">0</text>`;
  svg += `<path d="${linePath}" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  svg += `<circle cx="${x(data.length - 1)}" cy="${y(last.value)}" r="5" fill="#2a78d6" stroke="${CHART_SURFACE}" stroke-width="2"/>`;
  svg += `<text x="${x(data.length - 1)}" y="${y(last.value) - 10}" text-anchor="end" font-size="11" fill="${CHART_INK_PRIMARY}" font-weight="600">${last.value}</text>`;
  data.forEach((d, i) => {
    svg += `<circle cx="${x(i)}" cy="${y(d.value)}" r="10" fill="transparent"><title>${d.label}: ${d.value} eventos</title></circle>`;
  });
  svg += `</svg>`;
  return chartWrap(title, svg);
}

function renderMagnitudeDistributionChart(data, title) {
  if (!data.length) return emptyChart(title);
  const width = 400, height = 220, pad = { top: 16, right: 16, bottom: 28, left: 32 };
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - pad.left - pad.right, innerH = height - pad.top - pad.bottom;
  const barWidth = Math.min(32, innerW / data.length - 2);

  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">`;
  svg += `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + innerH}" y2="${pad.top + innerH}" stroke="${CHART_BASELINE}" stroke-width="1"/>`;
  data.forEach((d, i) => {
    const barH = (d.value / maxVal) * innerH;
    const bx = pad.left + i * (innerW / data.length) + (innerW / data.length - barWidth) / 2;
    const by = pad.top + innerH - barH;
    const color = CHART_SEQUENTIAL[Math.min(i, CHART_SEQUENTIAL.length - 1)];
    svg += `<rect x="${bx}" y="${by}" width="${barWidth}" height="${Math.max(barH, 1)}" rx="4" fill="${color}"><title>${d.label}: ${d.value}</title></rect>`;
    svg += `<text x="${bx + barWidth / 2}" y="${pad.top + innerH + 16}" text-anchor="middle" font-size="11" fill="${CHART_INK_MUTED}">${d.label}</text>`;
  });
  svg += `</svg>`;
  return chartWrap(title, svg);
}

function renderRegionsRankingChart(data, title) {
  if (!data.length) return emptyChart(title);
  const width = 400, rowHeight = 28, height = Math.max(data.length * rowHeight + 20, 60);
  const padLeft = 140, padRight = 40;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - padLeft - padRight;

  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">`;
  data.forEach((d, i) => {
    const barW = Math.max((d.value / maxVal) * innerW, 2);
    const y = 10 + i * rowHeight;
    const label = d.label.length > 20 ? d.label.slice(0, 20) + "…" : d.label;
    svg += `<text x="${padLeft - 8}" y="${y + 14}" text-anchor="end" font-size="11" fill="${CHART_INK_SECONDARY}">${label}</text>`;
    svg += `<rect x="${padLeft}" y="${y}" width="${barW}" height="16" rx="4" fill="#2a78d6"/>`;
    svg += `<text x="${padLeft + barW + 6}" y="${y + 13}" font-size="11" fill="${CHART_INK_PRIMARY}" font-weight="600">${d.value}</text>`;
  });
  svg += `</svg>`;
  return chartWrap(title, svg);
}
