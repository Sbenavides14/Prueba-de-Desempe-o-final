-- Creo aquí todas mis tablas, agrupadas por esquema.

-- === raw: guardo el payload crudo de USGS, sin tipar ===
CREATE TABLE IF NOT EXISTS raw.earthquake_events_raw (
    id          TEXT PRIMARY KEY,
    payload     JSONB NOT NULL,
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_url  TEXT NOT NULL
);

-- === staging: mismo evento, ya limpio y tipado ===
CREATE TABLE IF NOT EXISTS staging.earthquake_events (
    id          TEXT PRIMARY KEY,
    mag         NUMERIC,
    place       TEXT,
    event_time  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,
    tsunami     BOOLEAN,
    sig         INTEGER,
    status      TEXT,
    mag_type    TEXT,
    event_type  TEXT,
    url         TEXT,
    longitude   NUMERIC,
    latitude    NUMERIC,
    depth_km    NUMERIC,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === curated: solo lo que pasa mis validaciones de calidad, listo para consumo ===
CREATE TABLE IF NOT EXISTS curated.earthquake_events (
    id             TEXT PRIMARY KEY,
    mag            NUMERIC,
    place          TEXT,
    event_time     TIMESTAMPTZ NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL,
    tsunami        BOOLEAN,
    sig            INTEGER,
    status         TEXT,
    mag_type       TEXT,
    event_type     TEXT,
    url            TEXT,
    longitude      NUMERIC,
    latitude       NUMERIC,
    depth_km       NUMERIC,
    quality_score  NUMERIC,
    ingested_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardo aquí cada evento que rechazo en la validación, con el motivo, para no perder nada.
CREATE TABLE IF NOT EXISTS curated.eventos_rechazados (
    rejection_id    BIGSERIAL PRIMARY KEY,
    id              TEXT,
    raw_payload     JSONB,
    motivo          TEXT NOT NULL,
    dag_run_id      TEXT,
    rechazado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardo el resultado de cada corrida de validación de calidad.
CREATE TABLE IF NOT EXISTS curated.quality_runs (
    run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dag_run_id          TEXT NOT NULL,
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    reglas_evaluadas    INTEGER,
    aprobados           INTEGER,
    rechazados          INTEGER,
    score               NUMERIC
);

-- Guardo cada reporte narrativo que genera mi IA, junto con las cifras que lo respaldan.
CREATE TABLE IF NOT EXISTS curated.ai_reports (
    report_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date     DATE NOT NULL,
    summary_text    TEXT NOT NULL,
    stats_json      JSONB NOT NULL,
    model           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardo cada llamada a mi IA (reporte, anomalías o chat), para tener trazabilidad de costo y tiempo.
CREATE TABLE IF NOT EXISTS curated.ai_runs (
    run_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type        TEXT NOT NULL,
    model           TEXT,
    tokens          INTEGER,
    latency_ms      INTEGER,
    cost_estimate   NUMERIC DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardo cada anomalía que detecto (enjambres, picos de actividad).
CREATE TABLE IF NOT EXISTS curated.anomalies (
    anomaly_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_ids       TEXT[],
    explanation     TEXT,
    method          TEXT,
    severity        TEXT
);

-- Guardo el estado de cada ejecución de mis DAGs, para mostrarlo en la plataforma.
CREATE TABLE IF NOT EXISTS curated.pipeline_runs (
    dag_id          TEXT NOT NULL,
    run_id          TEXT NOT NULL,
    status          TEXT NOT NULL,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    PRIMARY KEY (dag_id, run_id)
);

-- === app: mis usuarios de login ===
CREATE TABLE IF NOT EXISTS app.users (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('viewer', 'admin')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
