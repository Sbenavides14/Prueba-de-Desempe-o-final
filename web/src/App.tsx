import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Reports } from "./pages/Reports";
import { Pipeline } from "./pages/Pipeline";
import { Chat } from "./pages/Chat";
import { IconDashboard, IconReports, IconPipeline, IconChat, IconLogout } from "./components/icons";

function Sidebar() {
  const { role, logout } = useAuth();
  const location = useLocation();
  if (!role) return null;

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
    { to: "/reports", label: "Reportes", icon: <IconReports /> },
    { to: "/pipeline", label: "Pipeline", icon: <IconPipeline /> },
    { to: "/chat", label: "Chat de datos", icon: <IconChat /> },
  ];

  const email = localStorage.getItem("email") || (role === "admin" ? "admin@sismowatch.local" : "viewer@sismowatch.local");

  return (
    <aside className="sidebar">
      <div className="brand"><span className="dot" />SismoWatch</div>
      <nav>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={location.pathname === l.to ? "active" : ""}>
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="user-box">
        <div className="who">
          <span className="email">{email}</span>
          <span className="role">{role}</span>
        </div>
        <button className="secondary" onClick={logout} title="Salir"><IconLogout size={16} /></button>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <div className="main-area">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
