"""Guardo el resultado de mi validación: lo bueno a curated, lo malo a rechazados, y las métricas siempre."""
import json

import pandas as pd

from include.db import get_connection

FETCH_STAGING_SQL = "SELECT * FROM staging.earthquake_events"

UPSERT_CURATED_SQL = """
    INSERT INTO curated.earthquake_events
        (id, mag, place, event_time, updated_at, tsunami, sig, status, mag_type,
         event_type, url, longitude, latitude, depth_km, ingested_at)
    VALUES (%(id)s, %(mag)s, %(place)s, %(event_time)s, %(updated_at)s, %(tsunami)s,
            %(sig)s, %(status)s, %(mag_type)s, %(event_type)s, %(url)s,
            %(longitude)s, %(latitude)s, %(depth_km)s, now())
    ON CONFLICT (id) DO UPDATE SET
        mag = EXCLUDED.mag, place = EXCLUDED.place, event_time = EXCLUDED.event_time,
        updated_at = EXCLUDED.updated_at, tsunami = EXCLUDED.tsunami, sig = EXCLUDED.sig,
        status = EXCLUDED.status, mag_type = EXCLUDED.mag_type, event_type = EXCLUDED.event_type,
        url = EXCLUDED.url, longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude,
        depth_km = EXCLUDED.depth_km, ingested_at = now()
"""

INSERT_REJECTED_SQL = """
    INSERT INTO curated.eventos_rechazados (id, raw_payload, motivo, dag_run_id)
    VALUES (%(id)s, %(raw_payload)s, %(motivo)s, %(dag_run_id)s)
"""

INSERT_QUALITY_RUN_SQL = """
    INSERT INTO curated.quality_runs (dag_run_id, reglas_evaluadas, aprobados, rechazados, score)
    VALUES (%(dag_run_id)s, %(reglas_evaluadas)s, %(aprobados)s, %(rechazados)s, %(score)s)
"""


def fetch_staging_dataframe() -> pd.DataFrame:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        return pd.read_sql(FETCH_STAGING_SQL, conn)
    finally:
        conn.close()


def persist_approved(df: pd.DataFrame) -> None:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            for row in df.to_dict(orient="records"):
                cur.execute(UPSERT_CURATED_SQL, row)
    finally:
        conn.close()


def persist_rejected(rejected: list[dict], dag_run_id: str) -> None:
    if not rejected:
        return
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            for item in rejected:
                cur.execute(INSERT_REJECTED_SQL, {
                    "id": item.get("id"),
                    "raw_payload": json.dumps(item.get("raw_payload"), default=str),
                    "motivo": item.get("motivo"),
                    "dag_run_id": dag_run_id,
                })
    finally:
        conn.close()


def persist_quality_run(dag_run_id: str, total_reglas: int, aprobados: int, rechazados: int) -> None:
    total = aprobados + rechazados
    score = (aprobados / total) if total > 0 else 1.0
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            cur.execute(INSERT_QUALITY_RUN_SQL, {
                "dag_run_id": dag_run_id,
                "reglas_evaluadas": total_reglas,
                "aprobados": aprobados,
                "rechazados": rechazados,
                "score": score,
            })
    finally:
        conn.close()
