"""Dejo registro del estado de cada corrida de DAG, para que mi plataforma lo muestre."""
from include.db import get_connection

UPSERT_SQL = """
    INSERT INTO curated.pipeline_runs (dag_id, run_id, status, started_at, finished_at)
    VALUES (%(dag_id)s, %(run_id)s, %(status)s, %(started_at)s, now())
    ON CONFLICT (dag_id, run_id) DO UPDATE SET
        status = EXCLUDED.status, finished_at = now()
"""


def _record(context: dict, status: str) -> None:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            cur.execute(UPSERT_SQL, {
                "dag_id": context["dag"].dag_id,
                "run_id": context["run_id"],
                "status": status,
                "started_at": context["dag_run"].start_date,
            })
    finally:
        conn.close()


def record_success(context: dict) -> None:
    _record(context, "success")


def record_failure(context: dict) -> None:
    _record(context, "failed")
