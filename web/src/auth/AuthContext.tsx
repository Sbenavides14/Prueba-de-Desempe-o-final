import { createContext, useContext, useState, ReactNode } from "react";

type AuthState = { role: string | null; login: (role: string, token: string, email: string) => void; logout: () => void };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));

  const login = (newRole: string, token: string, email: string) => {
    localStorage.setItem("role", newRole);
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setRole(null);
  };

  return <AuthContext.Provider value={{ role, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
