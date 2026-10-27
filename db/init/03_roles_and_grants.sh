#!/bin/bash
# Creo aquí mis roles de mínimo privilegio, usando las contraseñas que recibo por variable
# de entorno. Nunca escribo una contraseña real dentro de este archivo.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- Uso este rol solo para la tarea de ingesta: únicamente puede insertar en raw.
    CREATE ROLE ${INGESTOR_DB_USER} LOGIN PASSWORD '${INGESTOR_DB_PASSWORD}';
    GRANT USAGE ON SCHEMA raw TO ${INGESTOR_DB_USER};
    GRANT INSERT, SELECT, UPDATE ON raw.earthquake_events_raw TO ${INGESTOR_DB_USER};

    -- Uso este rol para la tarea de transformación: lee raw, escribe staging/curated/rechazados.
    CREATE ROLE ${TRANSFORMER_DB_USER} LOGIN PASSWORD '${TRANSFORMER_DB_PASSWORD}';
    GRANT USAGE ON SCHEMA raw, staging, curated TO ${TRANSFORMER_DB_USER};
    GRANT SELECT ON raw.earthquake_events_raw TO ${TRANSFORMER_DB_USER};
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA staging TO ${TRANSFORMER_DB_USER};
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA curated TO ${TRANSFORMER_DB_USER};
    -- También dejo que este rol siembre mi usuario admin al arrancar: es el único
    -- rol con permiso de escritura fuera de curated, y solo toca app.users.
    GRANT USAGE ON SCHEMA app TO ${TRANSFORMER_DB_USER};
    GRANT SELECT, INSERT ON app.users TO ${TRANSFORMER_DB_USER};
    GRANT USAGE, SELECT ON SEQUENCE app.users_id_seq TO ${TRANSFORMER_DB_USER};

    -- Uso este rol en mi api: solo puede leer curated y la tabla de usuarios para el login.
    CREATE ROLE ${READER_DB_USER} LOGIN PASSWORD '${READER_DB_PASSWORD}';
    GRANT USAGE ON SCHEMA curated, app TO ${READER_DB_USER};
    GRANT SELECT ON ALL TABLES IN SCHEMA curated TO ${READER_DB_USER};
    GRANT SELECT ON app.users TO ${READER_DB_USER};

    -- Uso este rol solo para que Airflow guarde su propia metadata (sus tablas internas).
    CREATE ROLE ${AIRFLOW_DB_USER} LOGIN PASSWORD '${AIRFLOW_DB_PASSWORD}';
    GRANT ALL PRIVILEGES ON SCHEMA public TO ${AIRFLOW_DB_USER};

EOSQL
