import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { IconPipeline, IconShield, IconAlert, IconDownload } from "../components/icons";

const STATUS_BADGE: Record<string, "good" | "bad" | "warn" | "neutral"> = {
  success: "good",
  failed: "bad",
  running: "warn",
  queued: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Exitoso",
  failed: "Falló",
  running: "Corriendo",
  queued: "En cola",
};

export function Pipeline() {
  const [status, setStatus] = useState<any>(null);
  const [quarantine, setQuarantine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    const calls = [api.getPipelineStatus()];
    if (role === "admin") calls.push(api.getQuarantine());

    Promise.all(calls)
      .then(([statusData, quarantineData]) => {
        setStatus(statusData);
        if (quarantineData) setQuarantine(quarantineData.eventos_rechazados);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [role]);

  async function handleBackfill() {
    setActionMsg("Cargando datos históricos...");
    try {
      const result = await api.launchBackfill();
      setActionMsg(result.mensaje);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  async function handleRegenerate() {
    setActionMsg("Regenerando reporte...");
    try {
      const result = await api.regenerateReport();
      setActionMsg(result.mensaje);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  if (loading) return <div className="page"><p className="state-message">Cargando estado del pipeline...</p></div>;
  if (error) return <div className="page"><p className="error-message"><IconAlert size={16} /> No pude cargar el estado del pipeline: {error}</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Estado del pipeline</h1>
        <p className="page-desc">Qué está corriendo mi orquestación, con qué resultado, y la calidad de los datos que pasan.</p>
      </div>

      {role === "admin" && (
        <div className="card" style={{ marginBottom: 24, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={handleBackfill}><IconDownload size={16} /> Cargar datos históricos</button>
          <button className="secondary" onClick={handleRegenerate}>Regenerar reporte con IA</button>
          {actionMsg && <span className="action-message">{actionMsg}</span>}
        </div>
      )}

      <div className="section">
        <div className="section-head"><h2><IconPipeline size={16} /> Últimas corridas</h2></div>
        <p className="section-desc">Resultado de las ejecuciones más recientes de mis 4 flujos de Airflow.</p>
        {status?.ultimas_corridas?.length === 0 ? (
          <p className="state-message">Todavía no tengo corridas registradas.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Flujo</th><th>Estado</th><th>Terminó</th></tr></thead>
              <tbody>
                {status?.ultimas_corridas?.map((r: any) => (
                  <tr key={r.run_id}>
                    <td>{r.dag_id}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || "neutral"}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                    <td>{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {role === "admin" && (
        <div className="section">
          <div className="section-head"><h2><IconShield size={16} /> Eventos rechazados por calidad</h2></div>
          <p className="section-desc">Registros que no pasaron mis reglas de validación y nunca llegaron a `curated`.</p>
          {quarantine.length === 0 ? (
            <p className="state-message">No tengo eventos rechazados por ahora — buena señal.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Id</th><th>Motivo</th><th>Rechazado en</th></tr></thead>
                <tbody>
                  {quarantine.map((q) => (
                    <tr key={q.rejection_id}>
                      <td>{q.id}</td>
                      <td><span className="badge bad">{q.motivo}</span></td>
                      <td>{new Date(q.rechazado_en).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
