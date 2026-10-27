"""Acciones solo para admin: lanzar un backfill o regenerar el reporte de IA."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import require_role
from app.airflow_client import trigger_dag

router = APIRouter(prefix="/api/admin", tags=["admin"])


class BackfillRequest(BaseModel):
    start_date: str | None = None
    end_date: str | None = None


@router.post("/backfill")
def launch_backfill(body: BackfillRequest, user: dict = Depends(require_role("admin"))):
    start = body.start_date or (date.today() - timedelta(days=30)).isoformat()
    end = body.end_date or date.today().isoformat()
    try:
        result = trigger_dag("backfill_historical", conf={"start_date": start, "end_date": end})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"No pude lanzar la carga histórica en Airflow: {exc}")
    return {"mensaje": "Carga de datos históricos lanzada.", "dag_run_id": result.get("dag_run_id")}


@router.post("/reports/regenerate")
def regenerate_report(user: dict = Depends(require_role("admin"))):
    try:
        result = trigger_dag("daily_ai_report")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"No pude relanzar el reporte en Airflow: {exc}")
    return {"mensaje": "Regeneración de reporte lanzada.", "dag_run_id": result.get("dag_run_id")}
