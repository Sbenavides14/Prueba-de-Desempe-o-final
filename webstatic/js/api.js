// Cliente de mi api, en JavaScript puro, sin frameworks.
// La URL base viene de config.js (lo cargo antes que este script en cada página).
const API_URL = API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(response) {
  if (!response.ok) {
    let detail = response.statusText;
    try { detail = (await response.json()).detail || detail; } catch (e) {}
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/login.html";
    }
    throw new Error(detail);
  }
  return response.json();
}

const api = {
  login: (email, password) =>
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  getKpis: () => fetch(`${API_URL}/api/kpis`, { headers: authHeaders() }).then(handle),

  getEvents: (params = {}) =>
    fetch(`${API_URL}/api/events?${new URLSearchParams(params)}`, { headers: authHeaders() }).then(handle),

  getTimeseries: () => fetch(`${API_URL}/api/stats/timeseries`, { headers: authHeaders() }).then(handle),

  getMagnitudeDistribution: () => fetch(`${API_URL}/api/stats/magnitude-distribution`, { headers: authHeaders() }).then(handle),

  getTopRegions: () => fetch(`${API_URL}/api/stats/regions`, { headers: authHeaders() }).then(handle),

  getReports: (params = {}) =>
    fetch(`${API_URL}/api/reports?${new URLSearchParams(params)}`, { headers: authHeaders() }).then(handle),

  getPipelineStatus: () => fetch(`${API_URL}/api/pipeline/status`, { headers: authHeaders() }).then(handle),

  getQuarantine: () => fetch(`${API_URL}/api/quality/quarantine`, { headers: authHeaders() }).then(handle),

  launchBackfill: () =>
    fetch(`${API_URL}/api/admin/backfill`, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: "{}" }).then(handle),

  regenerateReport: () =>
    fetch(`${API_URL}/api/admin/reports/regenerate`, { method: "POST", headers: authHeaders() }).then(handle),

  chat: (question) =>
    fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }).then(handle),

  streamUrl: () => `${API_URL}/api/stream?token=${localStorage.getItem("token") || ""}`,
  exportReportsUrl: (format, filters = {}) => `${API_URL}/api/reports/export?${new URLSearchParams({ format, ...filters })}`,
};
