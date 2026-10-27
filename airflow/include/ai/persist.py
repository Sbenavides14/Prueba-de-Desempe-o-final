"""Guardo cada reporte y cada llamada a mi IA, nunca dejo una ejecución sin rastro."""
from datetime import date

from include.db import get_connection


def persist_report(stats_json: str, summary_text: str, model: str) -> None:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO curated.ai_reports (report_date, summary_text, stats_json, model)
                VALUES (%s, %s, %s, %s)
                """,
                (date.today(), summary_text, stats_json, model),
            )
    finally:
        conn.close()


def persist_anomalies(anomalies: list[dict], method: str = "zscore") -> None:
    if not anomalies:
        return
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            for item in anomalies:
                cur.execute(
                    """
                    INSERT INTO curated.anomalies (explanation, method, severity)
                    VALUES (%s, %s, %s)
                    """,
                    (item["explanation"], method, item["severity"]),
                )
    finally:
        conn.close()


def persist_ai_run(run_type: str, model: str, tokens: int, latency_ms: int, cost_estimate: float = 0) -> None:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO curated.ai_runs (run_type, model, tokens, latency_ms, cost_estimate)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (run_type, model, tokens, latency_ms, cost_estimate),
            )
    finally:
        conn.close()
