"""Traigo rangos históricos de USGS, partidos por semana para no pedir demasiado de una sola vez."""
from datetime import date, timedelta

import requests

from include.net_ipv4_only import enforce_ipv4_only

enforce_ipv4_only()

REQUEST_TIMEOUT_SECONDS = 30
QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


def _week_ranges(start: date, end: date):
    current = start
    while current < end:
        chunk_end = min(current + timedelta(days=7), end)
        yield current, chunk_end
        current = chunk_end


def fetch_historical_features(start_date: str, end_date: str, min_magnitude: float = 2.5) -> list[dict]:
    """Pido el histórico en trozos semanales y junto todos los features en una sola lista."""
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    all_features = []
    for chunk_start, chunk_end in _week_ranges(start, end):
        response = requests.get(
            QUERY_URL,
            params={
                "format": "geojson",
                "starttime": chunk_start.isoformat(),
                "endtime": chunk_end.isoformat(),
                "minmagnitude": min_magnitude,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        all_features.extend(response.json().get("features", []))

    return all_features
