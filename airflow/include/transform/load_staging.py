"""Leo lo que tengo en raw y lo dejo limpio y tipado en staging."""
from include.db import get_connection


def fetch_raw_payloads() -> list[dict]:
    """Traigo todos los payloads de raw. Mi volumen es bajo (feed por hora), así que no necesito paginar."""
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT payload FROM raw.earthquake_events_raw")
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


UPSERT_STAGING_SQL = """
    INSERT INTO staging.earthquake_events
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


def upsert_staging_rows(rows: list[dict]) -> None:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            for row in rows:
                cur.execute(UPSERT_STAGING_SQL, row)
    finally:
        conn.close()
