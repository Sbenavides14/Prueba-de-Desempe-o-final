import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../api";
export function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        api.getReports()
            .then((data) => setReports(data.reports))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx("div", { className: "page", children: _jsx("p", { className: "state-message", children: "Cargando reportes..." }) });
    if (error)
        return _jsx("div", { className: "page", children: _jsxs("p", { className: "error-message", children: ["No pude cargar los reportes: ", error] }) });
    return (_jsxs("div", { className: "page", children: [_jsx("h1", { children: "Reportes diarios de IA" }), _jsx("p", { className: "subtitle", children: "Res\u00FAmenes generados autom\u00E1ticamente a partir de los datos de curated." }), _jsxs("div", { style: { marginBottom: 20, display: "flex", gap: 8 }, children: [_jsx("a", { href: api.exportReportsUrl("csv"), children: _jsx("button", { className: "secondary", children: "Exportar CSV" }) }), _jsx("a", { href: api.exportReportsUrl("pdf"), children: _jsx("button", { className: "secondary", children: "Exportar PDF" }) })] }), reports.length === 0 ? (_jsx("p", { className: "state-message", children: "Todav\u00EDa no tengo reportes generados." })) : (reports.map((r) => (_jsxs("div", { className: "report-card", children: [_jsxs("div", { className: "report-meta", children: [r.report_date, " \u2014 generado ", new Date(r.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }), " \u00B7 modelo: ", r.model] }), _jsx("p", { style: { margin: 0 }, children: r.summary_text })] }, r.report_id))))] }));
}
