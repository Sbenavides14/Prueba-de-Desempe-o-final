import { useEffect, useState } from "react";
import { api } from "../api";
import { IconReports, IconFilter, IconAlert, IconCheck } from "../components/icons";

const PAGE_SIZE = 10;

function activeExportFilters(filters: { start_date: string; end_date: string }): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.start_date) out.start_date = filters.start_date;
  if (filters.end_date) out.end_date = filters.end_date;
  return out;
}

export function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ start_date: "", end_date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadReports(targetPage = page, activeFilters = filters) {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = { page: String(targetPage), page_size: String(PAGE_SIZE) };
    if (activeFilters.start_date) params.start_date = activeFilters.start_date;
    if (activeFilters.end_date) params.end_date = activeFilters.end_date;
    return api.getReports(params)
      .then((data) => {
        setReports(data.reports);
        setTotal(data.total);
        setPage(targetPage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReports(1);
  }, []);

  function handleApplyFilters() {
    loadReports(1);
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}><IconReports size={24} /> Reportes diarios de IA</h1>
        <p className="page-desc">Resúmenes narrativos generados automáticamente, con las cifras exactas que los respaldan.</p>
      </div>

      <div className="section-head"><h2><IconFilter size={16} /> Filtrar por fecha</h2></div>
      <div className="filters-bar">
        <label>
          Desde
          <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        </label>
        <label>
          Hasta
          <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
        </label>
        <button onClick={handleApplyFilters}>Aplicar</button>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <a href={api.exportReportsUrl("csv", activeExportFilters(filters))}><button className="secondary">Exportar CSV</button></a>
          <a href={api.exportReportsUrl("pdf", activeExportFilters(filters))}><button className="secondary">Exportar PDF</button></a>
        </span>
      </div>

      {loading ? (
        <p className="state-message">Cargando reportes...</p>
      ) : error ? (
        <p className="error-message"><IconAlert size={16} /> No pude cargar los reportes: {error}</p>
      ) : reports.length === 0 ? (
        <p className="state-message">No encontré reportes con estos filtros.</p>
      ) : (
        <>
          {reports.map((r) => (
            <ReportCard key={r.report_id} report={r} />
          ))}

          <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginTop: 16 }}>
            <button className="secondary" disabled={page <= 1} onClick={() => loadReports(page - 1)}>← Anterior</button>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Página {page} de {totalPages}</span>
            <button className="secondary" disabled={page >= totalPages} onClick={() => loadReports(page + 1)}>Siguiente →</button>
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ report: r }: { report: any }) {
  const usedFallback = r.model === "fallback-template";
  let stats: any = null;
  try {
    stats = typeof r.stats_json === "string" ? JSON.parse(r.stats_json) : r.stats_json;
  } catch {
    stats = null;
  }

  return (
    <div className="report-card">
      <div className="report-meta" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{r.report_date} — generado {new Date(r.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</span>
        {usedFallback ? (
          <span className="badge warn">Plantilla de respaldo</span>
        ) : (
          <span className="badge good"><IconCheck size={12} /> Generado con IA · {r.model}</span>
        )}
      </div>
      <p style={{ margin: "8px 0" }}>{r.summary_text}</p>
      {stats && (
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-muted)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span>Eventos: <strong style={{ color: "var(--ink-secondary)" }}>{stats.total_eventos}</strong></span>
          <span>Magnitud máxima: <strong style={{ color: "var(--ink-secondary)" }}>{stats.magnitud_maxima ?? "—"}</strong></span>
          <span>Región más activa: <strong style={{ color: "var(--ink-secondary)" }}>{stats.region_mas_activa ?? "—"}</strong></span>
          <span>Alerta tsunami: <strong style={{ color: "var(--ink-secondary)" }}>{stats.hubo_alerta_tsunami ? "Sí" : "No"}</strong></span>
        </div>
      )}
    </div>
  );
}
