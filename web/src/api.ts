// Centralizo aquí todas mis llamadas a la api, siempre agregando mi token si lo tengo.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail || "Ocurrió un error inesperado.");
  }
  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  getKpis: () => fetch(`${API_URL}/api/kpis`, { headers: authHeaders() }).then(handle),

  getEvents: (params: Record<string, string> = {}) =>
    fetch(`${API_URL}/api/events?${new URLSearchParams(params)}`, { headers: authHeaders() }).then(handle),

  getTimeseries: () => fetch(`${API_URL}/api/stats/timeseries`, { headers: authHeaders() }).then(handle),

  getMagnitudeDistribution: () => fetch(`${API_URL}/api/stats/magnitude-distribution`, { headers: authHeaders() }).then(handle),

  getTopRegions: () => fetch(`${API_URL}/api/stats/regions`, { headers: authHeaders() }).then(handle),

  getReports: (params: Record<string, string> = {}) =>
    fetch(`${API_URL}/api/reports?${new URLSearchParams(params)}`, { headers: authHeaders() }).then(handle),

  getPipelineStatus: () => fetch(`${API_URL}/api/pipeline/status`, { headers: authHeaders() }).then(handle),

  getQuarantine: () => fetch(`${API_URL}/api/quality/quarantine`, { headers: authHeaders() }).then(handle),

  launchBackfill: () =>
    fetch(`${API_URL}/api/admin/backfill`, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: "{}" }).then(handle),

  regenerateReport: () =>
    fetch(`${API_URL}/api/admin/reports/regenerate`, { method: "POST", headers: authHeaders() }).then(handle),

  chat: (question: string) =>
    fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }).then(handle),

  streamUrl: () => `${API_URL}/api/stream?token=${localStorage.getItem("token") || ""}`,
  exportReportsUrl: (format: string, filters: Record<string, string> = {}) => {
    const params = new URLSearchParams({ format, ...filters });
    return `${API_URL}/api/reports/export?${params}`;
  },
};
