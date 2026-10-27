"""Disparo DAGs de Airflow desde la api, usando su propia API REST con mi usuario admin."""
import os
import requests

from app.net_ipv4_only import enforce_ipv4_only

enforce_ipv4_only()

REQUEST_TIMEOUT_SECONDS = 10


def trigger_dag(dag_id: str, conf: dict | None = None) -> dict:
    url = f"{os.environ['AIRFLOW_API_URL']}/api/v1/dags/{dag_id}/dagRuns"
    response = requests.post(
        url,
        json={"conf": conf or {}},
        auth=(os.environ["AIRFLOW_ADMIN_USER"], os.environ["AIRFLOW_ADMIN_PASSWORD"]),
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()
