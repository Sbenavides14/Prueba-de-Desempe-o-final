"""Reviso aquí la salud del lote completo, no de una fila: ¿llegaron datos recientes? ¿llegaron ni muy pocos ni demasiados?"""
from datetime import datetime, timedelta, timezone

import pandas as pd

# Si mi última carga válida es más vieja que esto, considero que perdí frescura.
FRESHNESS_THRESHOLD_MINUTES = 30

# Fuera de este rango, considero el volumen del lote como anómalo (puede indicar
# que USGS cambió su formato o que mi conexión trajo un lote vacío/corrupto).
MIN_EXPECTED_EVENTS = 0
MAX_EXPECTED_EVENTS = 2000


def check_freshness(df: pd.DataFrame) -> tuple[bool, str]:
    if df.empty:
        return True, "Lote vacío: no evalúo frescura, no es un error de datos."

    latest_event_time = pd.to_datetime(df["updated_at"], utc=True).max()
    age = datetime.now(timezone.utc) - latest_event_time.to_pydatetime()

    if age > timedelta(minutes=FRESHNESS_THRESHOLD_MINUTES):
        return False, f"El evento más reciente tiene {age} de antigüedad, supera mi umbral de {FRESHNESS_THRESHOLD_MINUTES} min."
    return True, "Frescura dentro de lo esperado."


def check_volume(df: pd.DataFrame) -> tuple[bool, str]:
    count = len(df)
    if count > MAX_EXPECTED_EVENTS:
        return False, f"Recibí {count} eventos, supera mi máximo esperado de {MAX_EXPECTED_EVENTS}."
    return True, f"Volumen dentro de lo esperado ({count} eventos)."
