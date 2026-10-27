"""Aviso aquí cuando una tarea falla, mandando un mensaje simple a mi webhook."""
import os
import requests


def notify_failure(context: dict) -> None:
    """Uso esto como on_failure_callback en mis DAGs. Si el webhook no responde, no quiero romper nada más."""
    webhook_url = os.environ.get("ALERT_WEBHOOK_URL")
    if not webhook_url:
        return

    dag_id = context["dag"].dag_id
    task_id = context["task_instance"].task_id
    run_id = context["run_id"]

    message = f"Falló la tarea '{task_id}' del DAG '{dag_id}' (run: {run_id})."

    try:
        requests.post(webhook_url, json={"text": message}, timeout=5)
    except requests.RequestException:
        # Si ni mi alerta logra enviarse, lo dejo pasar: no quiero que una alerta rota
        # tape el error real que ya quedó registrado en los logs de Airflow.
        pass
