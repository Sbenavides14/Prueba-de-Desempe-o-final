"""Detecto picos de actividad sísmica inusuales comparando cada hora contra mi promedio histórico."""
import pandas as pd

from include.db import get_connection

# Si una hora se aleja de mi promedio más de esto, la marco como anómala.
ZSCORE_THRESHOLD = 2.5


def _hourly_counts() -> pd.DataFrame:
    conn = get_connection("TRANSFORMER_DB_USER", "TRANSFORMER_DB_PASSWORD")
    try:
        return pd.read_sql(
            """
            SELECT date_trunc('hour', event_time) AS hour_bucket, count(*) AS n
            FROM curated.earthquake_events
            WHERE event_time > now() - interval '7 days'
            GROUP BY hour_bucket
            ORDER BY hour_bucket
            """,
            conn,
        )
    finally:
        conn.close()


def detect_anomalies() -> list[dict]:
    """Calculo el z-score de cada hora y marco como anomalía las que superan mi umbral."""
    df = _hourly_counts()
    if len(df) < 5:
        return []

    mean = df["n"].mean()
    std = df["n"].std()
    if std == 0:
        return []

    df["zscore"] = (df["n"] - mean) / std
    anomalous = df[df["zscore"].abs() > ZSCORE_THRESHOLD]

    anomalies = []
    for _, row in anomalous.iterrows():
        severity = "alta" if abs(row["zscore"]) > 4 else "media"
        anomalies.append({
            "hour_bucket": row["hour_bucket"],
            "count": int(row["n"]),
            "zscore": float(row["zscore"]),
            "severity": severity,
            "explanation": (
                f"En la hora {row['hour_bucket']} registré {int(row['n'])} eventos, "
                f"muy por {'encima' if row['zscore'] > 0 else 'debajo'} de mi promedio habitual "
                f"({mean:.1f} eventos/hora, z-score={row['zscore']:.1f})."
            ),
        })
    return anomalies
