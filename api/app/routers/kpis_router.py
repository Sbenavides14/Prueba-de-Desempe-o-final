"""Calculo los indicadores que ve mi dashboard, siempre leyendo solo de curated."""
from fastapi import APIRouter, Depends

from app.auth import require_role
from app.db import query

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("")
def get_kpis(user: dict = Depends(require_role("viewer", "admin"))):
    rows = query("""
        SELECT
            count(*) FILTER (WHERE event_time > now() - interval '24 hours') AS eventos_24h,
            max(mag) FILTER (WHERE event_time > now() - interval '24 hours') AS magnitud_maxima,
            avg(mag) FILTER (WHERE event_time > now() - interval '24 hours') AS magnitud_promedio,
            count(*) FILTER (WHERE tsunami AND event_time > now() - interval '24 hours') AS alertas_tsunami,
            max(ingested_at) AS ultima_actualizacion
        FROM curated.earthquake_events
    """)
    quality_rows = query("""
        SELECT score FROM curated.quality_runs ORDER BY executed_at DESC LIMIT 1
    """)

    kpis = rows[0] if rows else {}
    kpis["puntaje_calidad"] = quality_rows[0]["score"] if quality_rows else None
    return kpis
