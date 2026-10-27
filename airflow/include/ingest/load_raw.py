"""Guardo en raw los eventos que recibo de USGS, sin tocar ni limpiar nada todavía."""
import json

from include.db import get_connection

UPSERT_SQL = """
    INSERT INTO raw.earthquake_events_raw (id, payload, fetched_at, source_url)
    VALUES (%s, %s, now(), %s)
    ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        fetched_at = EXCLUDED.fetched_at
"""


def upsert_raw_events(features: list[dict], source_url: str) -> int:
    """Inserto o actualizo cada evento por su id, así nunca duplico un sismo que ya tenía."""
    conn = get_connection("INGESTOR_DB_USER", "INGESTOR_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            for feature in features:
                cur.execute(UPSERT_SQL, (feature["id"], json.dumps(feature), source_url))
        return len(features)
    finally:
        conn.close()
