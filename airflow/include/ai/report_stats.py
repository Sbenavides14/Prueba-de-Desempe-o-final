"""Calculo yo mismo (SQL/Python) las cifras del reporte. El LLM nunca calcula un número, solo redacta."""
from pydantic import BaseModel

from include.db import get_connection


class ReportStats(BaseModel):
    total_eventos: int
    magnitud_maxima: float | None
    region_mas_activa: str | None
    hubo_alerta_tsunami: bool


def compute_last_24h_stats() -> ReportStats:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT count(*), max(mag), bool_or(tsunami)
                FROM curated.earthquake_events
                WHERE event_time > now() - interval '24 hours'
            """)
            total, max_mag, tsunami = cur.fetchone()

            cur.execute("""
                SELECT place, count(*) AS n
                FROM curated.earthquake_events
                WHERE event_time > now() - interval '24 hours' AND place IS NOT NULL
                GROUP BY place
                ORDER BY n DESC
                LIMIT 1
            """)
            row = cur.fetchone()
            top_region = row[0] if row else None

        return ReportStats(
            total_eventos=total or 0,
            magnitud_maxima=float(max_mag) if max_mag is not None else None,
            region_mas_activa=top_region,
            hubo_alerta_tsunami=bool(tsunami),
        )
    finally:
        conn.close()
