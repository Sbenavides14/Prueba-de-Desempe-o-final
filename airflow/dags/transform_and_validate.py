"""
## Transformo y valido mis eventos sísmicos

Me disparo solo en cuanto termina mi DAG de ingesta (consumo su Dataset).
Limpio y tipo mis eventos con Spark, los valido con mis reglas de calidad,
y solo dejo pasar a curated lo que las cumple. Lo que no, queda en
eventos_rechazados con el motivo, y nunca se pierde.
"""
from datetime import datetime, timedelta

import pandas as pd
from airflow.datasets import Dataset
from airflow.decorators import dag, task

from include.transform.spark_session import get_local_spark
from include.transform.geojson_to_row import parse_feature_to_staging_row
from include.transform.load_staging import fetch_raw_payloads, upsert_staging_rows
from include.quality.validate import validate_rows
from include.quality.batch_checks import check_freshness, check_volume
from include.quality.persist import fetch_staging_dataframe, persist_approved, persist_rejected, persist_quality_run
from include.alerts.webhook import notify_failure
from include.monitoring.pipeline_runs import record_success, record_failure

RAW_EVENTS_DATASET = Dataset("postgres://raw/earthquake_events_raw")

default_args = {
    "retries": 2,
    "retry_delay": timedelta(seconds=30),
    "execution_timeout": timedelta(minutes=5),
    "on_failure_callback": notify_failure,
}


@dag(
    dag_id="transform_and_validate",
    schedule=[RAW_EVENTS_DATASET],
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    default_args=default_args,
    tags=["transformacion", "calidad"],
    doc_md=__doc__,
    on_success_callback=record_success,
    on_failure_callback=record_failure,
)
def transform_and_validate():

    @task
    def transform_to_staging() -> int:
        """Leo raw, limpio con Spark (en modo local) y dejo el resultado en staging."""
        payloads = fetch_raw_payloads()
        if not payloads:
            return 0

        spark = get_local_spark("transform_and_validate")
        try:
            rows = spark.sparkContext.parallelize(payloads).map(parse_feature_to_staging_row).collect()
        finally:
            spark.stop()

        upsert_staging_rows(rows)
        return len(rows)

    @task
    def validate_and_publish(staged_count: int) -> dict:
        """Bloqueo el paso a curated si los datos no pasan mis reglas de calidad."""
        from airflow.operators.python import get_current_context
        context = get_current_context()
        dag_run_id = context["run_id"]

        if staged_count == 0:
            persist_quality_run(dag_run_id, total_reglas=0, aprobados=0, rechazados=0)
            return {"aprobados": 0, "rechazados": 0}

        df = fetch_staging_dataframe()

        fresh_ok, fresh_msg = check_freshness(df)
        volume_ok, volume_msg = check_volume(df)
        if not fresh_ok or not volume_ok:
            # Si fallan mis controles de lote, no publico nada en curated en esta corrida:
            # prefiero no mostrar datos sospechosos a que el dashboard muestre algo erróneo.
            raise ValueError(f"Falló un control de lote. Frescura: {fresh_msg} | Volumen: {volume_msg}")

        approved, rejected = validate_rows(df)
        persist_approved(approved)
        persist_rejected(rejected, dag_run_id)
        persist_quality_run(
            dag_run_id,
            total_reglas=len(df.columns),
            aprobados=len(approved),
            rechazados=len(rejected),
        )
        return {"aprobados": len(approved), "rechazados": len(rejected)}

    staged_count = transform_to_staging()
    validate_and_publish(staged_count)


transform_and_validate()
