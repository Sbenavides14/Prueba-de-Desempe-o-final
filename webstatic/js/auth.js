// Manejo mi sesión en localStorage. Si no hay token, redirijo siempre al login
// — ninguna vista de datos es accesible sin sesión.
function requireAuth() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || !role) {
    window.location.href = "/login.html";
    return null;
  }
  return { token, role, email: localStorage.getItem("email") || "" };
}

// Si la página es solo para admin y el usuario es viewer, lo mando a su vista correcta.
function requireAdmin() {
  const session = requireAuth();
  if (!session) return null;
  if (session.role !== "admin") {
    window.location.href = "/viewer.html";
    return null;
  }
  return session;
}

function doLogout() {
  localStorage.clear();
  window.location.href = "/login.html";
}
