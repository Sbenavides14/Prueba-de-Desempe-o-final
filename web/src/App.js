import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Reports } from "./pages/Reports";
import { Pipeline } from "./pages/Pipeline";
import { Chat } from "./pages/Chat";
function Nav() {
    const { role, logout } = useAuth();
    const location = useLocation();
    if (!role)
        return null;
    const links = [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/reports", label: "Reportes" },
        { to: "/pipeline", label: "Pipeline" },
        { to: "/chat", label: "Chat" },
    ];
    return (_jsxs("nav", { className: "navbar", children: [_jsx("span", { className: "brand", children: "SismoWatch" }), links.map((l) => (_jsx(Link, { to: l.to, className: location.pathname === l.to ? "active" : "", children: l.label }, l.to))), _jsx("span", { className: "spacer" }), _jsx("span", { className: "role-badge", children: role }), _jsx("button", { className: "secondary", onClick: logout, children: "Salir" })] }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsxs(BrowserRouter, { children: [_jsx(Nav, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/reports", element: _jsx(ProtectedRoute, { children: _jsx(Reports, {}) }) }), _jsx(Route, { path: "/pipeline", element: _jsx(ProtectedRoute, { children: _jsx(Pipeline, {}) }) }), _jsx(Route, { path: "/chat", element: _jsx(ProtectedRoute, { children: _jsx(Chat, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] })] }) }));
}
