# SismoWatch

Monitoreo sísmico global en tiempo casi real, construido sobre el feed público de USGS.

Documentación:
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — diseño, capas de datos, justificación de cada herramienta.
- [`AGENTS.md`](AGENTS.md) — contexto para retomar el proyecto (persona o IA), incluida una particularidad del entorno Docker de esta máquina.

## Cómo levantar el proyecto

1. Copio `.env.example` a `.env` y completo cada valor. Nunca subo mi `.env` real al repositorio.
2. Genero mis claves de Airflow:
   ```bash
   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # AIRFLOW_FERNET_KEY
   python3 -c "import secrets; print(secrets.token_hex(32))"  # AIRFLOW_WEBSERVER_SECRET_KEY y JWT_SECRET
   ```
3. Levanto todo con un solo comando:
   ```bash
   docker compose up -d
   ```
4. La primera vez, Ollama necesita descargar el modelo:
   ```bash
   docker compose exec ollama ollama pull llama3.1:8b
   ```
5. Entro a los servicios (confirmo los puertos reales con `docker compose ps`, ya que pueden variar — ver `AGENTS.md`):
   - Plataforma web: `http://localhost:3020` (redirige a `login.html`)
   - API: `http://localhost:8016/docs`
   - Airflow: `http://localhost:8080`

**Credenciales** (de prueba, viven en `.env`):
- Admin: `admin@sismowatch.local` / `TestPass123_local`
- Viewer: `viewer@sismowatch.local` / `TestPass123_local`
- Airflow: `admin` / `TestPass123_local`

## Arquitectura, en resumen

Patrón Medallion: `raw` (dato crudo de USGS) → `staging` (limpio y tipado) → `curated` (validado, lo único que lee la API). Detalle completo en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Plataforma web

HTML, CSS y JavaScript puro, sin framework ni paso de compilación — se sirve directo con nginx, montado como volumen (editar un archivo aplica con solo recargar el navegador).

Dos vistas separadas según el rol:
- **`viewer.html`**: dashboard con globo 3D interactivo de eventos (Three.js vía `globe.gl`), tarjetas de últimos sismos, gráficos (serie temporal, distribución por magnitud, regiones más activas), filtros, reportes de IA, estado del pipeline y chat de datos.
- **`admin.html`**: todo lo anterior, más el panel de administración (lanzar carga histórica, regenerar reporte, ver cuarentena de calidad).

El login redirige automáticamente a la vista que corresponde según el rol del usuario.

## Calidad de datos

**Pandera** valida esquema, tipos, rangos (lat/lon/magnitud) y unicidad de `id`; controles propios revisan frescura y volumen del lote. Las validaciones son bloqueantes: si fallan, el dato no llega a `curated` y queda en `curated.eventos_rechazados` con el motivo. Cada corrida guarda sus métricas en `curated.quality_runs`, visibles en la vista de Pipeline.

## Seguridad

- Secretos solo en `.env`, cubierto por `.gitignore`.
- Mínimo privilegio en Postgres: roles `ingestor` (solo inserta en raw), `transformer` (lee raw, escribe staging/curated), `reader` (solo lee curated, lo usa la API).
- JWT con roles (`viewer` / `admin`) verificado en cada endpoint — el frontend también oculta acciones de admin, pero el control real está en el backend.
- CORS restringido al origen del propio frontend.
- Texto sanitizado antes de enviarlo al LLM (mitigo prompt injection); el chat valida que el SQL generado sea `SELECT`-only y solo toque `curated` antes de ejecutarlo.
- Escaneo de seguridad: `gitleaks detect` (secretos) y `bandit -r airflow/include api/app` (código).

## IA

- **Proveedor**: Ollama con Llama 3.1 8B, local, sin API externa de pago.
- **Reporte diario**: calculo las cifras con SQL/Python, le pido al modelo que solo redacte, y valido que el texto coincida con las cifras calculadas. Si no coinciden o el modelo falla, uso una plantilla de respaldo.
- **Detección de anomalías**: z-score sobre la actividad horaria de los últimos 7 días.
- **Chat en lenguaje natural**: clasifica la intención del mensaje (saludo / fuera de tema / pregunta de datos — los saludos comunes se detectan por regla, sin gastar una llamada al modelo) y, para preguntas de datos, genera SQL restringido a `curated`, lo valida, lo ejecuta, y redacta la respuesta final verificando que las cifras no estén inventadas.
- Prompts versionados en `airflow/include/prompts/` y `api/app/prompts/`. Cada llamada de IA queda registrada en `curated.ai_runs` (modelo, tokens, latencia).

## Tiempo real

**SSE** (Server-Sent Events): la necesidad es unidireccional (el servidor avisa de eventos nuevos), más simple de implementar y reconectar que WebSocket.

## Pruebas

```bash
docker compose exec airflow-sched pytest /opt/airflow/tests
docker compose exec api16 pytest tests   # confirmo el nombre real con: docker compose ps
```

## Limitaciones conocidas

- Spark corre en modo local (sin cluster); decisión documentada en `docs/ARQUITECTURA.md`.
- JWT sin refresh token.
- El token de sesión viaja como query param en el endpoint de SSE, porque `EventSource` no soporta cabeceras personalizadas.
- Sin modo oscuro.

## Mejoras con más tiempo

- Secrets backend real (Vault/AWS Secrets Manager).
- Observabilidad de Airflow con Prometheus/Grafana.
- Refresh tokens y expiración configurable por rol.
