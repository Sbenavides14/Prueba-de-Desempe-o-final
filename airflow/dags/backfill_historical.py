"""
## Hago backfill histórico de USGS

Lo disparo manualmente, pasando start_date/end_date como parámetros de ejecución.
Por defecto cargo los últimos 30 días. Reutilizo el mismo upsert por id que mi
ingesta normal, así nunca duplico un evento que ya tenía.
"""
from datetime import datetime, timedelta

from airflow.datasets import Dataset
from airflow.decorators import dag, task
from airflow.models.param import Param

from include.ingest.usgs_backfill_client import fetch_historical_features
from include.ingest.load_raw import upsert_raw_events
from include.alerts.webhook import notify_failure
from include.monitoring.pipeline_runs import record_success, record_failure

RAW_EVENTS_DATASET = Dataset("postgres://raw/earthquake_events_raw")

default_args = {
    "retries": 3,
    "retry_delay": timedelta(minutes=1),
    "retry_exponential_backoff": True,
    "execution_timeout": timedelta(minutes=20),
    "on_failure_callback": notify_failure,
}


@dag(
    dag_id="backfill_historical",
    schedule=None,
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    default_args=default_args,
    tags=["ingesta", "backfill"],
    doc_md=__doc__,
    on_success_callback=record_success,
    on_failure_callback=record_failure,
    params={
        "start_date": Param(
            default=(datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d"),
            type="string",
            description="Fecha de inicio (YYYY-MM-DD). Por defecto, 30 días atrás.",
        ),
        "end_date": Param(
            default=datetime.utcnow().strftime("%Y-%m-%d"),
            type="string",
            description="Fecha de fin (YYYY-MM-DD). Por defecto, hoy.",
        ),
    },
)
def backfill_historical():

    @task(outlets=[RAW_EVENTS_DATASET])
    def fetch_and_store(**context) -> int:
        params = context["params"]
        features = fetch_historical_features(params["start_date"], params["end_date"])
        return upsert_raw_events(features, source_url="usgs-backfill")

    fetch_and_store()


backfill_historical()
