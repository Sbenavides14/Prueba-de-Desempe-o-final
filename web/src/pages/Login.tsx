import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { IconAlert } from "../components/icons";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.role, data.access_token, email);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "No pude iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-row"><span className="dot" /><h1>SismoWatch</h1></div>
        <p className="login-sub">Monitoreo sísmico global en tiempo casi real</p>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && (
            <p className="error-message" style={{ marginTop: 4, marginBottom: 0 }}>
              <IconAlert size={16} /> {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
