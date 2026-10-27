"""Entrego eventos sísmicos con filtros y paginación, y la serie de tiempo para mis gráficos."""
from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth import require_role
from app.db import query

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events")
def get_events(
    user: dict = Depends(require_role("viewer", "admin")),
    start_date: date | None = None,
    end_date: date | None = None,
    min_magnitude: float | None = None,
    region: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, le=200),
):
    conditions = []
    params: list = []

    if start_date:
        conditions.append("event_time >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("event_time <= %s")
        params.append(end_date)
    if min_magnitude is not None:
        conditions.append("mag >= %s")
        params.append(min_magnitude)
    if region:
        conditions.append("place ILIKE %s")
        params.append(f"%{region}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * page_size

    sql = f"""
        SELECT id, mag, place, event_time, tsunami, longitude, latitude, depth_km
        FROM curated.earthquake_events
        {where_clause}
        ORDER BY event_time DESC
        LIMIT %s OFFSET %s
    """
    rows = query(sql, tuple(params + [page_size, offset]))
    return {"page": page, "page_size": page_size, "events": rows}


@router.get("/stats/timeseries")
def get_timeseries(user: dict = Depends(require_role("viewer", "admin"))):
    rows = query("""
        SELECT date_trunc('hour', event_time) AS hora, count(*) AS eventos
        FROM curated.earthquake_events
        WHERE event_time > now() - interval '7 days'
        GROUP BY hora
        ORDER BY hora
    """)
    return {"series": rows}


@router.get("/stats/magnitude-distribution")
def get_magnitude_distribution(user: dict = Depends(require_role("viewer", "admin"))):
    """Agrupo mis eventos en rangos fijos de magnitud, para el gráfico de distribución."""
    rows = query("""
        SELECT
            CASE
                WHEN mag < 2 THEN '0-2'
                WHEN mag < 3 THEN '2-3'
                WHEN mag < 4 THEN '3-4'
                WHEN mag < 5 THEN '4-5'
                ELSE '5+'
            END AS rango,
            count(*) AS eventos
        FROM curated.earthquake_events
        WHERE mag IS NOT NULL
        GROUP BY rango
    """)
    order = {"0-2": 0, "2-3": 1, "3-4": 2, "4-5": 3, "5+": 4}
    rows.sort(key=lambda r: order.get(r["rango"], 99))
    return {"distribucion": rows}


@router.get("/stats/regions")
def get_top_regions(user: dict = Depends(require_role("viewer", "admin")), limite: int = 8):
    """Devuelvo mis regiones con más actividad sísmica, para el gráfico de ranking."""
    rows = query(
        """
        SELECT
            -- USGS suele escribir "12 km NW of Lugar, País": me quedo solo con
            -- el nombre del lugar, quitando el prefijo de distancia/dirección.
            COALESCE(NULLIF(regexp_replace(place, '^.*\\sof\\s+', ''), ''), place) AS region,
            count(*) AS eventos
        FROM curated.earthquake_events
        WHERE place IS NOT NULL
        GROUP BY region
        ORDER BY eventos DESC
        LIMIT %s
        """,
        (limite,),
    )
    return {"regiones": rows}
