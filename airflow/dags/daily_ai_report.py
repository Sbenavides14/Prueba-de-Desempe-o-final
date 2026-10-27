"""
## Genero mi reporte diario con IA y detecto anomalías

Corro una vez al día. Calculo mis cifras con código (nunca con el LLM), le pido
al modelo que redacte un resumen en lenguaje humano, y verifico que no haya
inventado ningún número. Además, reviso mis últimos 7 días buscando picos de
actividad inusuales con z-score.
"""
from datetime import datetime, timedelta

from airflow.decorators import dag, task

from include.ai.report_stats import compute_last_24h_stats
from include.ai.report_builder import build_daily_report
from include.ai.anomaly_detection import detect_anomalies
from include.ai.persist import persist_report, persist_ai_run, persist_anomalies
from include.alerts.webhook import notify_failure
from include.monitoring.pipeline_runs import record_success, record_failure

default_args = {
    "retries": 2,
    "retry_delay": timedelta(minutes=2),
    "execution_timeout": timedelta(minutes=10),
    "on_failure_callback": notify_failure,
}


@dag(
    dag_id="daily_ai_report",
    schedule="0 6 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    default_args=default_args,
    tags=["ia", "reporte", "anomalias"],
    doc_md=__doc__,
    on_success_callback=record_success,
    on_failure_callback=record_failure,
)
def daily_ai_report():

    @task
    def generate_report() -> None:
        stats = compute_last_24h_stats()
        result = build_daily_report(stats)

        persist_report(stats.model_dump_json(), result["text"], result["model"])
        persist_ai_run(
            run_type="report",
            model=result["model"],
            tokens=result["tokens"],
            latency_ms=result["latency_ms"],
        )

    @task
    def detect_and_persist_anomalies() -> None:
        anomalies = detect_anomalies()
        persist_anomalies(anomalies, method="zscore")
        persist_ai_run(run_type="anomaly", model="zscore", tokens=0, latency_ms=0)

    generate_report()
    detect_and_persist_anomalies()


daily_ai_report()
