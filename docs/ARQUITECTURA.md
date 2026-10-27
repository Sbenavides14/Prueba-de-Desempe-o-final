# Arquitectura de SismoWatch

## Propósito

Construí este sistema para convertir el feed público de USGS (que cambia cada minuto y no guarda historial) en un producto de datos confiable para las áreas de operaciones y riesgo de SuperApp. Resuelvo tres problemas: (1) que los datos lleguen solos, validados y sin duplicarse, (2) que la IA ayude a resumir y detectar anomalías sin inventar cifras, y (3) que el equipo pueda consultar todo en un dashboard propio, en reportes y en tiempo real.

## Diagrama de componentes

```
USGS API ──> [Airflow: ingest_usgs] ──> raw ──> [Airflow: transform_and_validate] ──┬──> curated ──> [api FastAPI] ──> [web HTML/JS]
                     │ (cada 5 min)         (Spark local + Pandera)                 └──> eventos_rechazados
                     │
                     └──> Dataset dispara el siguiente DAG automáticamente

[Airflow: daily_ai_report] ──> lee curated ──> Ollama (Llama 3.1 8B) ──> ai_reports / anomalies / ai_runs

[Airflow: backfill_historical] ──> mismo camino que ingest_usgs, pero con rango de fechas manual

[web HTML/JS] ──> [api FastAPI] ──> clasifica intención ──> SALUDO/FUERA_DE_TEMA (respuesta fija)
                                                         └──> DATOS: genera SQL validado ──> curated ──> redacta respuesta
```

## Capas de datos (arquitectura Medallion)

- **raw**: el payload GeoJSON de USGS, tal cual llega, sin tipar. Guardo esto para nunca perder el dato original, incluso si mi lógica de transformación tiene un bug.
- **staging**: el mismo evento, ya limpio y tipado (fechas reales, números, no texto), pero todavía no garantizado como "bueno para el negocio".
- **curated**: solo lo que pasó mis reglas de calidad. Es la única capa que lee mi api — nunca expongo raw ni staging al exterior.
- **eventos_rechazados**: vive en el esquema curated, pero es mi tabla de "lo que no pasó", con el motivo. Nunca pierdo un registro, solo lo separo.

## Modelo de datos

| Tabla | Esquema | Propósito | Llave |
|---|---|---|---|
| `earthquake_events_raw` | raw | Payload crudo de USGS | `id` (del evento USGS) |
| `earthquake_events` | staging | Evento limpio y tipado | `id` |
| `earthquake_events` | curated | Evento validado, listo para consumo | `id` |
| `eventos_rechazados` | curated | Registros que fallaron calidad, con motivo | `rejection_id` |
| `quality_runs` | curated | Métricas de cada corrida de validación | `run_id` |
| `ai_reports` | curated | Reportes narrativos diarios de IA (incluye `stats_json` con las cifras exactas) | `report_id` |
| `ai_runs` | curated | Trazabilidad de cada llamada de IA (modelo, tokens, latencia) | `run_id` |
| `anomalies` | curated | Anomalías detectadas por z-score | `anomaly_id` |
| `pipeline_runs` | curated | Estado de cada corrida de mis DAGs | `(dag_id, run_id)` |
| `users` | app | Usuarios de login (viewer/admin) | `id` |

Todas mis tablas de eventos usan upsert por `id`: un mismo sismo puede llegar actualizado (cambia su magnitud o estado), y nunca quiero duplicarlo, solo actualizarlo.

## Justificación de cada herramienta

- **Apache Airflow**: necesito orquestar varias tareas dependientes (ingesta → transformación → calidad → IA) con reintentos, alertas y disparo automático entre ellas. Un cron no me da nada de esto: ni visibilidad, ni reintentos con backoff, ni dependencias entre tareas.
- **PySpark en modo local** (sin cluster): el enunciado de mi evaluación exige usar Spark. Mi volumen de datos (cientos de eventos por hora) no justifica un cluster distribuido, así que lo corro en `local[*]`, dentro del mismo contenedor de Airflow, sin agregar infraestructura extra. Documento esto como decisión consciente, no como desconocimiento de la herramienta.
- **PostgreSQL**: es relacional, lo que necesito para consultar, filtrar y relacionar mis datos (KPIs, series de tiempo, filtros). No necesito almacenamiento de objetos (MinIO/S3): mi "dato crudo" es JSON pequeño, cabe perfecto en una columna JSONB.
- **Pandera**: mis reglas de calidad son validaciones de esquema sobre un DataFrame — Pandera es ligero, pythonic, y se integra directo en una tarea de Airflow sin infraestructura adicional (a diferencia de Great Expectations, más pesado para este alcance).
- **Ollama + Llama 3.1 8B (local)**: necesito un modelo de IA sin depender de una API externa de pago. 8B es el punto óptimo: corre en hardware modesto y sigue instrucciones de formato (JSON/cifras) mejor que modelos más chicos.
- **z-score**: mi técnica de detección de anomalías. La elegí por ser simple de explicar y defender: comparo cada hora contra el promedio histórico, sin necesitar entrenar un modelo.
- **FastAPI**: necesito una api con autenticación, validación de entrada y documentación automática (OpenAPI) sin esfuerzo adicional.
- **HTML, CSS y JavaScript puro, sin framework ni paso de build**: no necesito la complejidad de un framework de UI para el número de vistas que tengo. Sin build significa que puedo servir el frontend con nginx montado como volumen — cambiar un archivo aplica con solo recargar el navegador, sin reconstruir ningún contenedor.
- **Globo 3D con `globe.gl` (sobre Three.js, vía CDN)**: para un producto de monitoreo sísmico *global*, un globo interactivo comunica mejor la distribución geográfica real de la actividad que un mapa plano — y `globe.gl` da esto con una API de una sola línea por propiedad, sin necesitar WebGL a mano.
- **Gráficos en SVG propio**: evito dependencias pesadas para los pocos tipos de gráfico que necesito (serie temporal, distribución por magnitud, ranking de regiones); controlo exactamente las especificaciones de marca (grosor de línea, gridlines, paleta validada contra daltonismo).
- **Clasificación de intención antes de generar SQL** (en el chat): no necesito un RAG — es un problema de clasificación de tres categorías (saludo / fuera de tema / pregunta de datos), no de recuperar contexto de documentos. Los saludos comunes se detectan por regla simple, sin gastar una llamada al modelo.
- **SSE sobre WebSocket**: mi necesidad es unidireccional (el servidor avisa de eventos nuevos), SSE es más simple de implementar y de reconectar que WebSocket para este caso.
- **`network_mode: bridge` en vez de la red personalizada de Docker Compose**: esta máquina en particular tiene las reglas de NAT rotas en las redes personalizadas que crea Compose, lo que impedía la salida a internet de mis contenedores. Uso la red `bridge` por defecto de Docker en su lugar, que sí funciona en cualquier entorno — ver `AGENTS.md` para el detalle completo de esta y otras particularidades del entorno.

## Vistas separadas por rol

El frontend tiene dos páginas distintas (no una sola con secciones ocultas por CSS): `viewer.html` y `admin.html`. La de admin incluye además el panel de administración (lanzar carga histórica, regenerar reporte, ver cuarentena de calidad). El login redirige a la vista correcta según el rol que devuelve la API — y aunque alguien intente entrar directo a `admin.html` por URL, cada acción de administrador sigue exigiendo el rol correcto en el backend, así que ocultar la vista es solo UX, no el control de seguridad real.

## Decisiones y trade-offs

- **¿Por qué Airflow y no un cron?** Porque necesito reintentos con backoff, dependencias entre tareas (Dataset), alertas automáticas y visibilidad de qué pasó en cada corrida. Un cron no me da nada de esto, y lo tendría que reconstruir a mano.
- **¿Por qué estas capas y no otras?** Porque separan responsabilidades: si mi lógica de limpieza tiene un bug, no pierdo el dato original (sigue en raw). Si mis reglas de calidad cambian, puedo re-procesar desde staging sin volver a pedirle nada a USGS.
- **¿Qué haría diferente en producción?** Agregaría un secrets backend real (Vault/AWS Secrets Manager) en vez de variables de entorno planas; movería Spark a un cluster real si el volumen creciera; agregaría un segundo entorno (staging de infraestructura, no confundir con mi esquema staging) antes de producción; y añadiría métricas de observabilidad (Prometheus/Grafana) sobre Airflow, no solo mi tabla `pipeline_runs`.
- **¿Por qué un único Postgres con esquemas, no bases separadas?** Simplicidad operativa: un solo motor que respaldar, administrar y conectar, con la misma separación lógica lograda a través de esquemas y roles de mínimo privilegio.
