import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Si no tengo sesión, nunca dejo ver ninguna ruta de datos: redirijo siempre al login.
export function ProtectedRoute({ children, requireAdmin = false }: { children: JSX.Element; requireAdmin?: boolean }) {
  const { role } = useAuth();

  if (!role) return <Navigate to="/login" replace />;
  if (requireAdmin && role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}
