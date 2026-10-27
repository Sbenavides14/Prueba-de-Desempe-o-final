import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
const STATUS_COLOR = {
    success: "#0ca30c",
    failed: "#d03b3b",
    running: "#eda100",
    queued: "#898781",
};
export function Pipeline() {
    const [status, setStatus] = useState(null);
    const [quarantine, setQuarantine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const { role } = useAuth();
    useEffect(() => {
        const calls = [api.getPipelineStatus()];
        if (role === "admin")
            calls.push(api.getQuarantine());
        Promise.all(calls)
            .then(([statusData, quarantineData]) => {
            setStatus(statusData);
            if (quarantineData)
                setQuarantine(quarantineData.eventos_rechazados);
        })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [role]);
    async function handleBackfill() {
        setActionMsg("Cargando datos históricos...");
        try {
            const result = await api.launchBackfill();
            setActionMsg(result.mensaje);
        }
        catch (err) {
            setActionMsg(`Error: ${err.message}`);
        }
    }
    async function handleRegenerate() {
        setActionMsg("Regenerando reporte...");
        try {
            const result = await api.regenerateReport();
            setActionMsg(result.mensaje);
        }
        catch (err) {
            setActionMsg(`Error: ${err.message}`);
        }
    }
    if (loading)
        return _jsx("div", { className: "page", children: _jsx("p", { className: "state-message", children: "Cargando estado del pipeline..." }) });
    if (error)
        return _jsx("div", { className: "page", children: _jsxs("p", { className: "error-message", children: ["No pude cargar el estado del pipeline: ", error] }) });
    return (_jsxs("div", { className: "page", children: [_jsx("h1", { children: "Estado del pipeline" }), role === "admin" && (_jsxs("div", { className: "card", style: { marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [_jsx("button", { onClick: handleBackfill, children: "Cargar datos hist\u00F3ricos" }), _jsx("button", { className: "secondary", onClick: handleRegenerate, children: "Regenerar reporte con IA" }), actionMsg && _jsx("span", { className: "action-message", style: { marginTop: 0 }, children: actionMsg })] })), _jsx("h2", { children: "\u00DAltimas corridas" }), status?.ultimas_corridas?.length === 0 ? (_jsx("p", { className: "state-message", children: "Todav\u00EDa no tengo corridas registradas." })) : (_jsxs("table", { style: { marginBottom: 20 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "DAG" }), _jsx("th", { children: "Estado" }), _jsx("th", { children: "Termin\u00F3" })] }) }), _jsx("tbody", { children: status?.ultimas_corridas?.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: r.dag_id }), _jsx("td", { children: _jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[r.status] || "#898781", display: "inline-block" } }), r.status] }) }), _jsx("td", { children: r.finished_at })] }, r.run_id))) })] })), role === "admin" && (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Eventos rechazados (cuarentena de calidad)" }), quarantine.length === 0 ? (_jsx("p", { className: "state-message", children: "No tengo eventos rechazados por ahora." })) : (_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Id" }), _jsx("th", { children: "Motivo" }), _jsx("th", { children: "Rechazado en" })] }) }), _jsx("tbody", { children: quarantine.map((q) => (_jsxs("tr", { children: [_jsx("td", { children: q.id }), _jsx("td", { children: q.motivo }), _jsx("td", { children: q.rechazado_en })] }, q.rejection_id))) })] }))] }))] }));
}
