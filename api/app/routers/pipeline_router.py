"""Muestro el estado de mis DAGs y, solo a admin, el detalle de los eventos rechazados."""
from fastapi import APIRouter, Depends

from app.auth import require_role
from app.db import query

router = APIRouter(prefix="/api", tags=["pipeline"])


@router.get("/pipeline/status")
def get_pipeline_status(user: dict = Depends(require_role("viewer", "admin"))):
    runs = query("""
        SELECT dag_id, run_id, status, started_at, finished_at
        FROM curated.pipeline_runs
        ORDER BY finished_at DESC
        LIMIT 20
    """)
    quality = query("""
        SELECT run_id, executed_at, reglas_evaluadas, aprobados, rechazados, score
        FROM curated.quality_runs
        ORDER BY executed_at DESC
        LIMIT 1
    """)

    result = {"ultimas_corridas": runs}
    if user["role"] == "admin":
        result["calidad_detalle"] = quality[0] if quality else None
    else:
        result["calidad_resumen"] = {"score": quality[0]["score"]} if quality else None
    return result


@router.get("/quality/quarantine")
def get_quarantine(user: dict = Depends(require_role("admin"))):
    rows = query("""
        SELECT rejection_id, id, motivo, dag_run_id, rechazado_en
        FROM curated.eventos_rechazados
        ORDER BY rechazado_en DESC
        LIMIT 100
    """)
    return {"eventos_rechazados": rows}
