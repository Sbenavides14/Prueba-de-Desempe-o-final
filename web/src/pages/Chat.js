import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../api";
export function Chat() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await api.chat(question);
            setMessages((prev) => [...prev, { question, respuesta: data.respuesta, sql: data.sql_ejecutado, rows: data.resultados }]);
            setQuestion("");
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "page", children: [_jsx("h1", { children: "Preg\u00FAntale a tus datos" }), _jsx("p", { className: "subtitle", children: "No soy un chat general: solo respondo preguntas sobre tus datos s\u00EDsmicos. Preg\u00FAntame cosas como magnitudes, conteos, regiones o fechas." }), _jsxs("form", { onSubmit: handleSubmit, className: "filters-bar", children: [_jsx("input", { value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "Ej: \u00BFCu\u00E1ntos eventos tuvieron magnitud mayor a 5 esta semana?", style: { flex: "1 1 400px" } }), _jsx("button", { disabled: loading, type: "submit", children: loading ? "Pensando... (hasta 30s)" : "Preguntar" })] }), error && _jsx("p", { className: "error-message", children: error }), messages.length === 0 && !error && _jsx("p", { className: "state-message", children: "Hazme una pregunta sobre tus datos s\u00EDsmicos." }), messages.map((m, i) => (_jsxs("div", { className: "chat-bubble", children: [_jsx("div", { className: "question", children: m.question }), _jsx("p", { className: "answer", children: m.respuesta }), m.sql && (_jsxs("details", { children: [_jsx("summary", { children: "Ver consulta y datos crudos" }), _jsx("pre", { style: { fontSize: 12, background: "#f4f3f0", padding: 8, borderRadius: 6, overflowX: "auto" }, children: m.sql }), !m.rows || m.rows.length === 0 ? _jsx("p", { className: "state-message", style: { padding: 0 }, children: "Sin resultados." }) : (_jsx("pre", { style: { fontSize: 12, overflowX: "auto" }, children: JSON.stringify(m.rows, null, 2) }))] }))] }, i)))] }));
}
