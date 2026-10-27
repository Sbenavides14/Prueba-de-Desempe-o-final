import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [role, setRole] = useState(localStorage.getItem("role"));
    const login = (newRole, token) => {
        localStorage.setItem("role", newRole);
        localStorage.setItem("token", token);
        setRole(newRole);
    };
    const logout = () => {
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        setRole(null);
    };
    return _jsx(AuthContext.Provider, { value: { role, login, logout }, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}
