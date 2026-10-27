import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
// Si no tengo sesión, nunca dejo ver ninguna ruta de datos: redirijo siempre al login.
export function ProtectedRoute({ children, requireAdmin = false }) {
    const { role } = useAuth();
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (requireAdmin && role !== "admin")
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    return children;
}
