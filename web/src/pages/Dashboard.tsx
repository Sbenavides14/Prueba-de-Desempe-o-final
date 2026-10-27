import { useEffect, useState, ReactNode } from "react";
import { api } from "../api";
import { TimeseriesChart, MagnitudeDistributionChart, RegionsRankingChart } from "../components/charts";
import { EventsMap } from "../components/EventsMap";
import { IconPulse, IconMagnitude, IconWave, IconCheck, IconMap, IconChart, IconFilter, IconAlert } from "../components/icons";

export function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [magnitudeDist, setMagnitudeDist] = useState<any[]>([]);
  const [topRegions, setTopRegions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const [filters, setFilters] = useState({ start_date: "", end_date: "", min_magnitude: "", region: "" });

  function loadEvents(activeFilters = filters) {
    const params: Record<string, string> = { page_size: "50" };
    if (activeFilters.start_date) params.start_date = activeFilters.start_date;
    if (activeFilters.end_date) params.end_date = activeFilters.end_date;
    if (activeFilters.min_magnitude) params.min_magnitude = activeFilters.min_magnitude;
    if (activeFilters.region) params.region = activeFilters.region;
    return api.getEvents(params).then((data) => setEvents(data.events));
  }

  useEffect(() => {
    Promise.all([api.getKpis(), loadEvents(), api.getTimeseries(), api.getMagnitudeDistribution(), api.getTopRegions()])
      .then(([kpiData, , tsData, magData, regData]) => {
        setKpis(kpiData);
        setTimeseries(tsData.series.map((r: any) => ({ label: new Date(r.hora).getHours() + "h", value: Number(r.eventos) })));
        setMagnitudeDist(magData.distribucion.map((r: any) => ({ label: r.rango, value: Number(r.eventos) })));
        setTopRegions(regData.regiones.map((r: any) => ({ label: r.region, value: Number(r.eventos) })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Me conecto una sola vez al stream en vivo; si se corta, el propio navegador
    // reintenta la conexión de EventSource automáticamente.
    const source = new EventSource(api.streamUrl());
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.addEventListener("new_events", (e: any) => {
      const newRows = JSON.parse(e.data);
      setEvents((prev) => [...newRows, ...prev].slice(0, 50));
      setLastUpdate(new Date().toLocaleTimeString());
    });
    return () => source.close();
  }, []);

  function handleApplyFilters() {
    setError(null);
    loadEvents().catch((err) => setError(err.message));
  }

  if (loading) return <div className="page"><p className="state-message">Cargando dashboard...</p></div>;
  if (error) return <div className="page"><p className="error-message"><IconAlert size={16} /> No pude cargar el dashboard: {error}</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-desc">Panorama general de la actividad sísmica monitoreada.</p>
      </div>

      <div className="live-badge">
        <span className={`live-dot ${live ? "on" : "off"}`} />
        {live ? "En vivo — nuevos eventos aparecen aquí automáticamente" : "Reconectando..."}
        {lastUpdate && ` · última actualización ${lastUpdate}`}
      </div>

      <div className="grid">
        <Kpi icon={<IconPulse />} label="Eventos últimas 24h" value={kpis?.eventos_24h ?? "—"} />
        <Kpi icon={<IconMagnitude />} label="Magnitud máxima" value={kpis?.magnitud_maxima ?? "—"} tone="warn" />
        <Kpi icon={<IconMagnitude />} label="Magnitud promedio" value={kpis?.magnitud_promedio?.toFixed?.(2) ?? "—"} />
        <Kpi icon={<IconWave />} label="Alertas de tsunami" value={kpis?.alertas_tsunami ?? "—"} tone={kpis?.alertas_tsunami > 0 ? "warn" : "good"} />
        <Kpi icon={<IconCheck />} label="Puntaje de calidad" value={kpis?.puntaje_calidad != null ? `${(kpis.puntaje_calidad * 100).toFixed(0)}%` : "—"} tone="good" />
      </div>

      <div className="section">
        <div className="section-head"><h2><IconMap size={16} /> Mapa de eventos</h2></div>
        <p className="section-desc">Ubicación de los sismos más recientes. El tamaño y color del punto indican la magnitud.</p>
        <div className="map-card">
          <EventsMap events={events} />
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2><IconChart size={16} /> Gráficos</h2></div>
        <p className="section-desc">Tendencia temporal, distribución por magnitud y regiones más activas.</p>
        <div className="grid">
          <div style={{ flexBasis: 400 }}>
            <TimeseriesChart data={timeseries} title="Eventos por hora (últimos 7 días)" />
          </div>
          <div style={{ flexBasis: 300 }}>
            <MagnitudeDistributionChart data={magnitudeDist} title="Distribución por magnitud" />
          </div>
          <div style={{ flexBasis: 300 }}>
            <RegionsRankingChart data={topRegions} title="Regiones con más actividad" />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2><IconFilter size={16} /> Filtrar eventos</h2></div>
        <div className="filters-bar">
          <label>
            Desde
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </label>
          <label>
            Hasta
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </label>
          <label>
            Magnitud mínima
            <input type="number" step="0.1" value={filters.min_magnitude} onChange={(e) => setFilters({ ...filters, min_magnitude: e.target.value })} style={{ width: 90 }} />
          </label>
          <label>
            Región
            <input type="text" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} placeholder="ej. Alaska" />
          </label>
          <button onClick={handleApplyFilters}>Aplicar filtros</button>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Últimos eventos</h2></div>
        {events.length === 0 ? (
          <p className="state-message">No encontré eventos con estos filtros.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Hora</th><th>Lugar</th><th>Magnitud</th><th>Tsunami</th></tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{new Date(ev.event_time).toLocaleString()}</td>
                    <td>{ev.place}</td>
                    <td><strong>{ev.mag}</strong></td>
                    <td>{ev.tsunami ? <span className="badge warn">Sí</span> : <span className="badge neutral">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: ReactNode; label: string; value: any; tone?: "good" | "warn" }) {
  return (
    <div className="kpi">
      <div className={`kpi-icon ${tone ?? ""}`}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  );
}
