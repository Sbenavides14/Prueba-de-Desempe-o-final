// Lógica compartida entre viewer.html y admin.html. Cada función revisa si su
// elemento existe en la página actual antes de tocar nada — así el mismo
// archivo sirve para ambas vistas sin romper si falta una sección.

let _lastEvents = [];

// ---------- KPIs ----------
async function loadKpis() {
  const el = document.getElementById("kpis");
  if (!el) return;
  try {
    const k = await api.getKpis();
    el.innerHTML = `
      ${kpiCard(Icons.pulse(), "Eventos últimas 24h", k.eventos_24h ?? "—")}
      ${kpiCard(Icons.magnitude(), "Magnitud máxima", k.magnitud_maxima ?? "—", "warn")}
      ${kpiCard(Icons.magnitude(), "Magnitud promedio", k.magnitud_promedio != null ? k.magnitud_promedio.toFixed(2) : "—")}
      ${kpiCard(Icons.wave(), "Alertas de tsunami", k.alertas_tsunami ?? "—", k.alertas_tsunami > 0 ? "warn" : "good")}
      ${kpiCard(Icons.check(), "Puntaje de calidad", k.puntaje_calidad != null ? `${(k.puntaje_calidad * 100).toFixed(0)}%` : "—", "good")}
    `;
  } catch (err) {
    el.innerHTML = `<p class="error-message">${Icons.alert(16)} No pude cargar los KPIs: ${err.message}</p>`;
  }
}

function kpiCard(icon, label, value, tone) {
  return `<div class="kpi"><div class="kpi-icon ${tone || ""}">${icon}</div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div></div>`;
}

// ---------- Eventos: tarjetas + globo + tabla ----------
function magBadgeClass(mag) {
  if (mag >= 5) return "mag-high";
  if (mag >= 3) return "mag-mid";
  return "";
}

function renderEventCards(events) {
  const el = document.getElementById("event-cards");
  if (!el) return;
  if (!events.length) {
    el.innerHTML = `<p class="state-message">No encontré eventos con estos filtros.</p>`;
    return;
  }
  el.innerHTML = events.slice(0, 12).map((ev) => `
    <div class="event-card ${magBadgeClass(ev.mag)}">
      <div class="event-mag">M${ev.mag}</div>
      <div class="event-place">${ev.place}</div>
      <div class="event-time">${new Date(ev.event_time).toLocaleString()}</div>
      <div class="event-tags">
        ${ev.tsunami ? `<span class="badge warn">${Icons.wave(12)} Tsunami</span>` : `<span class="badge neutral">Sin tsunami</span>`}
      </div>
    </div>
  `).join("");
}

function renderEventsTable(events) {
  const el = document.getElementById("events-table-body");
  if (!el) return;
  if (!events.length) {
    el.innerHTML = `<tr><td colspan="4"><p class="state-message">Sin eventos.</p></td></tr>`;
    return;
  }
  el.innerHTML = events.map((ev) => `
    <tr>
      <td>${new Date(ev.event_time).toLocaleString()}</td>
      <td>${ev.place}</td>
      <td><strong>${ev.mag}</strong></td>
      <td>${ev.tsunami ? '<span class="badge warn">Sí</span>' : '<span class="badge neutral">No</span>'}</td>
    </tr>
  `).join("");
}

async function loadEvents(filters) {
  filters = filters || {};
  const params = { page_size: "50" };
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.min_magnitude) params.min_magnitude = filters.min_magnitude;
  if (filters.region) params.region = filters.region;

  try {
    const data = await api.getEvents(params);
    _lastEvents = data.events;
    renderEventCards(_lastEvents);
    renderEventsTable(_lastEvents);
    updateGlobeEvents(_lastEvents);
  } catch (err) {
    const el = document.getElementById("event-cards");
    if (el) el.innerHTML = `<p class="error-message">${Icons.alert(16)} ${err.message}</p>`;
  }
}

function initFilters() {
  const btn = document.getElementById("apply-filters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    loadEvents({
      start_date: document.getElementById("filter-start").value,
      end_date: document.getElementById("filter-end").value,
      min_magnitude: document.getElementById("filter-mag").value,
      region: document.getElementById("filter-region").value,
    });
  });
}

// ---------- Tiempo real (SSE) ----------
function initLiveStream() {
  const dot = document.getElementById("live-dot");
  const label = document.getElementById("live-label");
  if (!dot) return;

  const source = new EventSource(api.streamUrl());
  source.onopen = () => { dot.className = "live-dot on"; if (label) label.textContent = "En vivo"; };
  source.onerror = () => { dot.className = "live-dot off"; if (label) label.textContent = "Reconectando..."; };
  source.addEventListener("new_events", (e) => {
    const newRows = JSON.parse(e.data);
    _lastEvents = [...newRows, ..._lastEvents].slice(0, 50);
    renderEventCards(_lastEvents);
    renderEventsTable(_lastEvents);
    updateGlobeEvents(_lastEvents);
    const updEl = document.getElementById("live-updated");
    if (updEl) updEl.textContent = `· última actualización ${new Date().toLocaleTimeString()}`;
  });
}

// ---------- Gráficos ----------
async function loadCharts() {
  const tsEl = document.getElementById("chart-timeseries");
  const magEl = document.getElementById("chart-magnitude");
  const regEl = document.getElementById("chart-regions");
  if (!tsEl && !magEl && !regEl) return;

  try {
    const [ts, mag, reg] = await Promise.all([api.getTimeseries(), api.getMagnitudeDistribution(), api.getTopRegions()]);
    if (tsEl) tsEl.innerHTML = renderTimeseriesChart(ts.series.map((r) => ({ label: new Date(r.hora).getHours() + "h", value: Number(r.eventos) })), "Eventos por hora (últimos 7 días)");
    if (magEl) magEl.innerHTML = renderMagnitudeDistributionChart(mag.distribucion.map((r) => ({ label: r.rango, value: Number(r.eventos) })), "Distribución por magnitud");
    if (regEl) regEl.innerHTML = renderRegionsRankingChart(reg.regiones.map((r) => ({ label: r.region, value: Number(r.eventos) })), "Regiones con más actividad");
  } catch (err) {
    if (tsEl) tsEl.innerHTML = `<p class="error-message">${Icons.alert(16)} ${err.message}</p>`;
  }
}

// ---------- Reportes ----------
const REPORTS_PAGE_SIZE = 10;
let _reportsPage = 1;
let _reportsFilters = {};

function reportCardHtml(r) {
  const usedFallback = r.model === "fallback-template";
  let stats = null;
  try { stats = typeof r.stats_json === "string" ? JSON.parse(r.stats_json) : r.stats_json; } catch (e) {}
  const badge = usedFallback
    ? `<span class="badge warn">Plantilla de respaldo</span>`
    : `<span class="badge good">${Icons.check(12)} Generado con IA · ${r.model}</span>`;
  const statsRow = stats ? `
    <div style="display:flex;gap:16px;font-size:12px;color:var(--ink-muted);border-top:1px solid var(--border);padding-top:8px;margin-top:4px;flex-wrap:wrap">
      <span>Eventos: <strong style="color:var(--ink-secondary)">${stats.total_eventos}</strong></span>
      <span>Magnitud máxima: <strong style="color:var(--ink-secondary)">${stats.magnitud_maxima ?? "—"}</strong></span>
      <span>Región más activa: <strong style="color:var(--ink-secondary)">${stats.region_mas_activa ?? "—"}</strong></span>
      <span>Alerta tsunami: <strong style="color:var(--ink-secondary)">${stats.hubo_alerta_tsunami ? "Sí" : "No"}</strong></span>
    </div>` : "";
  return `<div class="report-card">
    <div class="report-meta"><span>${r.report_date} — generado ${new Date(r.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</span>${badge}</div>
    <p style="margin:8px 0">${r.summary_text}</p>
    ${statsRow}
  </div>`;
}

async function loadReports(page) {
  const el = document.getElementById("reports-list");
  if (!el) return;
  _reportsPage = page || _reportsPage;
  el.innerHTML = `<p class="state-message">Cargando reportes...</p>`;

  const params = { page: String(_reportsPage), page_size: String(REPORTS_PAGE_SIZE) };
  if (_reportsFilters.start_date) params.start_date = _reportsFilters.start_date;
  if (_reportsFilters.end_date) params.end_date = _reportsFilters.end_date;

  try {
    const data = await api.getReports(params);
    if (!data.reports.length) {
      el.innerHTML = `<p class="state-message">No encontré reportes con estos filtros.</p>`;
    } else {
      el.innerHTML = data.reports.map(reportCardHtml).join("");
    }
    const totalPages = Math.max(Math.ceil(data.total / REPORTS_PAGE_SIZE), 1);
    const pager = document.getElementById("reports-pager");
    if (pager) {
      pager.innerHTML = `
        <button class="secondary" ${_reportsPage <= 1 ? "disabled" : ""} onclick="loadReports(${_reportsPage - 1})">← Anterior</button>
        <span style="font-size:13px;color:var(--ink-muted)">Página ${_reportsPage} de ${totalPages}</span>
        <button class="secondary" ${_reportsPage >= totalPages ? "disabled" : ""} onclick="loadReports(${_reportsPage + 1})">Siguiente →</button>
      `;
    }
  } catch (err) {
    el.innerHTML = `<p class="error-message">${Icons.alert(16)} ${err.message}</p>`;
  }
}

function initReportFilters() {
  const btn = document.getElementById("apply-report-filters");
  if (!btn) return;
  btn.addEventListener("click", () => {
    _reportsFilters = {
      start_date: document.getElementById("report-filter-start").value,
      end_date: document.getElementById("report-filter-end").value,
    };
    loadReports(1);
  });
  const csvLink = document.getElementById("export-csv");
  const pdfLink = document.getElementById("export-pdf");
  if (csvLink) csvLink.addEventListener("click", (e) => { e.preventDefault(); downloadExport("csv", "reportes.csv"); });
  if (pdfLink) pdfLink.addEventListener("click", (e) => { e.preventDefault(); downloadExport("pdf", "reportes.pdf"); });
}

// Un <a href> normal no puede llevar mi token de sesión (el navegador no manda
// cabeceras personalizadas al navegar), así que descargo con fetch (sí lleva el
// token) y disparo la descarga yo mismo a partir del archivo recibido.
async function downloadExport(format, filename) {
  try {
    const token = localStorage.getItem("token");
    const url = api.exportReportsUrl(format, _reportsFilters);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("No pude generar el archivo.");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    alert(`Error al exportar: ${err.message}`);
  }
}

// ---------- Pipeline ----------
const STATUS_BADGE = { success: "good", failed: "bad", running: "warn", queued: "neutral" };
const STATUS_LABEL = { success: "Exitoso", failed: "Falló", running: "Corriendo", queued: "En cola" };

async function loadPipelineStatus() {
  const el = document.getElementById("pipeline-runs");
  if (!el) return;
  try {
    const data = await api.getPipelineStatus();
    const runs = data.ultimas_corridas || [];
    el.innerHTML = runs.length === 0
      ? `<p class="state-message">Todavía no tengo corridas registradas.</p>`
      : `<div class="table-wrap"><table><thead><tr><th>Flujo</th><th>Estado</th><th>Terminó</th></tr></thead><tbody>
          ${runs.map((r) => `<tr><td>${r.dag_id}</td><td><span class="badge ${STATUS_BADGE[r.status] || "neutral"}">${STATUS_LABEL[r.status] || r.status}</span></td><td>${r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td></tr>`).join("")}
        </tbody></table></div>`;
  } catch (err) {
    el.innerHTML = `<p class="error-message">${Icons.alert(16)} ${err.message}</p>`;
  }
}

async function loadQuarantine() {
  const el = document.getElementById("quarantine-table");
  if (!el) return;
  try {
    const data = await api.getQuarantine();
    const rows = data.eventos_rechazados || [];
    el.innerHTML = rows.length === 0
      ? `<p class="state-message">No tengo eventos rechazados por ahora — buena señal.</p>`
      : `<div class="table-wrap"><table><thead><tr><th>Id</th><th>Motivo</th><th>Rechazado en</th></tr></thead><tbody>
          ${rows.map((q) => `<tr><td>${q.id}</td><td><span class="badge bad">${q.motivo}</span></td><td>${new Date(q.rechazado_en).toLocaleString()}</td></tr>`).join("")}
        </tbody></table></div>`;
  } catch (err) {
    el.innerHTML = `<p class="error-message">${Icons.alert(16)} ${err.message}</p>`;
  }
}

function initAdminActions() {
  const backfillBtn = document.getElementById("btn-backfill");
  const regenBtn = document.getElementById("btn-regenerate");
  const msgEl = document.getElementById("admin-action-msg");
  if (backfillBtn) backfillBtn.addEventListener("click", async () => {
    msgEl.textContent = "Cargando datos históricos...";
    try { msgEl.textContent = (await api.launchBackfill()).mensaje; } catch (err) { msgEl.textContent = `Error: ${err.message}`; }
  });
  if (regenBtn) regenBtn.addEventListener("click", async () => {
    msgEl.textContent = "Regenerando reporte...";
    try { msgEl.textContent = (await api.regenerateReport()).mensaje; } catch (err) { msgEl.textContent = `Error: ${err.message}`; }
  });
}

// ---------- Chat ----------
function initChat() {
  const form = document.getElementById("chat-form");
  if (!form) return;
  const input = document.getElementById("chat-input");
  const list = document.getElementById("chat-messages");
  const errEl = document.getElementById("chat-error");
  const btn = document.getElementById("chat-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value;
    if (!question.trim()) return;
    errEl.textContent = "";
    btn.disabled = true;
    btn.textContent = "Pensando...";
    try {
      const data = await api.chat(question);
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      let sqlBlock = "";
      if (data.sql_ejecutado) {
        sqlBlock = `<details><summary>Ver consulta y datos crudos</summary>
          <pre style="font-size:12px;background:#f4f3f0;padding:10px;border-radius:6px;overflow-x:auto;margin-top:8px">${data.sql_ejecutado}</pre>
          ${!data.resultados || !data.resultados.length ? '<p class="state-message" style="padding:12px">Sin resultados.</p>' : `<pre style="font-size:12px;overflow-x:auto">${JSON.stringify(data.resultados, null, 2)}</pre>`}
        </details>`;
      }
      bubble.innerHTML = `<div class="question">${question}</div><p class="answer">${data.respuesta || ""}</p>${sqlBlock}`;
      list.appendChild(bubble);
      bubble.scrollIntoView({ behavior: "smooth" });
      input.value = "";
    } catch (err) {
      errEl.innerHTML = `${Icons.alert(16)} ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Preguntar";
    }
  });
}
