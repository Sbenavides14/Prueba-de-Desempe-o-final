import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../api";
import { TimeseriesChart, MagnitudeDistributionChart, RegionsRankingChart } from "../components/charts";
import { EventsMap } from "../components/EventsMap";
export function Dashboard() {
    const [kpis, setKpis] = useState(null);
    const [events, setEvents] = useState([]);
    const [timeseries, setTimeseries] = useState([]);
    const [magnitudeDist, setMagnitudeDist] = useState([]);
    const [topRegions, setTopRegions] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [live, setLive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [filters, setFilters] = useState({ start_date: "", end_date: "", min_magnitude: "", region: "" });
    function loadEvents(activeFilters = filters) {
        const params = { page_size: "50" };
        if (activeFilters.start_date)
            params.start_date = activeFilters.start_date;
        if (activeFilters.end_date)
            params.end_date = activeFilters.end_date;
        if (activeFilters.min_magnitude)
            params.min_magnitude = activeFilters.min_magnitude;
        if (activeFilters.region)
            params.region = activeFilters.region;
        return api.getEvents(params).then((data) => setEvents(data.events));
    }
    useEffect(() => {
        Promise.all([api.getKpis(), loadEvents(), api.getTimeseries(), api.getMagnitudeDistribution(), api.getTopRegions()])
            .then(([kpiData, , tsData, magData, regData]) => {
            setKpis(kpiData);
            setTimeseries(tsData.series.map((r) => ({ label: new Date(r.hora).getHours() + "h", value: Number(r.eventos) })));
            setMagnitudeDist(magData.distribucion.map((r) => ({ label: r.rango, value: Number(r.eventos) })));
            setTopRegions(regData.regiones.map((r) => ({ label: r.region, value: Number(r.eventos) })));
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
        source.addEventListener("new_events", (e) => {
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
    if (loading)
        return _jsx("div", { className: "page", children: _jsx("p", { className: "state-message", children: "Cargando dashboard..." }) });
    if (error)
        return _jsx("div", { className: "page", children: _jsxs("p", { className: "error-message", children: ["No pude cargar el dashboard: ", error] }) });
    return (_jsxs("div", { className: "page", children: [_jsx("h1", { children: "Dashboard" }), _jsxs("div", { className: "live-badge", children: [_jsx("span", { className: `live-dot ${live ? "on" : "off"}` }), live ? "En vivo" : "Reconectando...", lastUpdate && ` — última actualización: ${lastUpdate}`] }), _jsxs("div", { className: "grid", children: [_jsx(Kpi, { label: "Eventos 24h", value: kpis?.eventos_24h ?? "—" }), _jsx(Kpi, { label: "Magnitud m\u00E1xima", value: kpis?.magnitud_maxima ?? "—" }), _jsx(Kpi, { label: "Magnitud promedio", value: kpis?.magnitud_promedio?.toFixed?.(2) ?? "—" }), _jsx(Kpi, { label: "Alertas tsunami", value: kpis?.alertas_tsunami ?? "—" }), _jsx(Kpi, { label: "Puntaje calidad", value: kpis?.puntaje_calidad != null ? `${(kpis.puntaje_calidad * 100).toFixed(0)}%` : "—" })] }), _jsx("h2", { children: "Mapa de eventos" }), _jsx(EventsMap, { events: events }), _jsx("h2", { children: "Gr\u00E1ficos" }), _jsxs("div", { className: "grid", children: [_jsx("div", { style: { flexBasis: 400 }, children: _jsx(TimeseriesChart, { data: timeseries, title: "Eventos por hora (\u00FAltimos 7 d\u00EDas)" }) }), _jsx("div", { style: { flexBasis: 300 }, children: _jsx(MagnitudeDistributionChart, { data: magnitudeDist, title: "Distribuci\u00F3n por magnitud" }) }), _jsx("div", { style: { flexBasis: 300 }, children: _jsx(RegionsRankingChart, { data: topRegions, title: "Regiones con m\u00E1s actividad" }) })] }), _jsx("h2", { children: "Filtros" }), _jsxs("div", { className: "filters-bar", children: [_jsxs("label", { children: ["Desde", _jsx("input", { type: "date", value: filters.start_date, onChange: (e) => setFilters({ ...filters, start_date: e.target.value }) })] }), _jsxs("label", { children: ["Hasta", _jsx("input", { type: "date", value: filters.end_date, onChange: (e) => setFilters({ ...filters, end_date: e.target.value }) })] }), _jsxs("label", { children: ["Magnitud m\u00EDnima", _jsx("input", { type: "number", step: "0.1", value: filters.min_magnitude, onChange: (e) => setFilters({ ...filters, min_magnitude: e.target.value }), style: { width: 80 } })] }), _jsxs("label", { children: ["Regi\u00F3n", _jsx("input", { type: "text", value: filters.region, onChange: (e) => setFilters({ ...filters, region: e.target.value }), placeholder: "ej. Alaska" })] }), _jsx("button", { onClick: handleApplyFilters, children: "Aplicar" })] }), _jsx("h2", { children: "\u00DAltimos eventos" }), events.length === 0 ? (_jsx("p", { className: "state-message", children: "No encontr\u00E9 eventos con estos filtros." })) : (_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Hora" }), _jsx("th", { children: "Lugar" }), _jsx("th", { children: "Magnitud" }), _jsx("th", { children: "Tsunami" })] }) }), _jsx("tbody", { children: events.map((ev) => (_jsxs("tr", { children: [_jsx("td", { children: new Date(ev.event_time).toLocaleString() }), _jsx("td", { children: ev.place }), _jsx("td", { children: ev.mag }), _jsx("td", { children: ev.tsunami ? "Sí" : "No" })] }, ev.id))) })] }))] }));
}
function Kpi({ label, value }) {
    return (_jsxs("div", { className: "kpi", children: [_jsx("div", { className: "kpi-label", children: label }), _jsx("div", { className: "kpi-value", children: value })] }));
}
