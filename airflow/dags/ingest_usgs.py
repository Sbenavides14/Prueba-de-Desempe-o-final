"""
## Ingesto el feed de USGS

Cada 5 minutos traigo el feed de sismos de la última hora y lo guardo en `raw`,
sin limpiar ni validar nada todavía — eso lo hace mi DAG de transformación,
que se dispara solo en cuanto este termina (lo conecto con un Dataset).
"""
import os
from datetime import datetime, timedelta

from airflow.datasets import Dataset
from airflow.decorators import dag, task

from include.ingest.usgs_client import fetch_geojson
from include.ingest.load_raw import upsert_raw_events
from include.alerts.webhook import notify_failure
from include.monitoring.pipeline_runs import record_success, record_failure

USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
RAW_EVENTS_DATASET = Dataset("postgres://raw/earthquake_events_raw")

default_args = {
    "retries": 3,
    # Espero cada vez un poco más entre reintentos, por si USGS está caído momentáneamente.
    "retry_delay": timedelta(seconds=30),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=3),
    "on_failure_callback": notify_failure,
}


@dag(
    dag_id="ingest_usgs",
    schedule="*/5 * * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    default_args=default_args,
    tags=["ingesta", "usgs"],
    doc_md=__doc__,
    on_success_callback=record_success,
    on_failure_callback=record_failure,
)
def ingest_usgs():

    @task(outlets=[RAW_EVENTS_DATASET])
    def fetch_and_store() -> int:
        """Traigo el feed y lo guardo en raw. Devuelvo solo un conteo, nunca el payload completo, por XCom."""
        payload = fetch_geojson(USGS_FEED_URL)
        features = payload.get("features", [])
        inserted = upsert_raw_events(features, source_url=USGS_FEED_URL)
        return inserted

    fetch_and_store()


ingest_usgs()
