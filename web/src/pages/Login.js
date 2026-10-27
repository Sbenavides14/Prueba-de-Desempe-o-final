import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await api.login(email, password);
            login(data.role, data.access_token);
            navigate("/dashboard");
        }
        catch (err) {
            setError(err.message || "No pude iniciar sesión.");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "login-screen", children: _jsxs("div", { className: "login-card", children: [_jsx("h1", { children: "SismoWatch" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { placeholder: "Correo", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("input", { placeholder: "Contrase\u00F1a", type: "password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { disabled: loading, type: "submit", children: loading ? "Entrando..." : "Entrar" }), error && _jsx("p", { className: "error-message", style: { marginTop: 10, marginBottom: 0 }, children: error })] })] }) }));
}
