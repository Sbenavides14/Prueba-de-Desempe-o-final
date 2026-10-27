"""Registro cada llamada de IA que hace mi api (el chat), igual que lo hago desde Airflow."""
import os
import psycopg2


def log_ai_run(run_type: str, model: str, tokens: int, latency_ms: int) -> None:
    conn = psycopg2.connect(
        host=os.environ["APP_DB_HOST"],
        port=os.environ["APP_DB_PORT"],
        dbname=os.environ["APP_DB_NAME"],
        user=os.environ["TRANSFORMER_DB_USER"],
        password=os.environ["TRANSFORMER_DB_PASSWORD"],
    )
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO curated.ai_runs (run_type, model, tokens, latency_ms, cost_estimate)
                VALUES (%s, %s, %s, %s, 0)
                """,
                (run_type, model, tokens, latency_ms),
            )
    finally:
        conn.close()
