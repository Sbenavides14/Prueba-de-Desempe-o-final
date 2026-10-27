"""Convierto un evento GeoJSON de USGS en una fila lista para mi tabla staging.

Esta función es pura (sin red, sin base de datos), a propósito: así la puedo probar
con un solo caso de entrada/salida, sin levantar nada más.
"""
from datetime import datetime, timezone


def _epoch_ms_to_datetime(epoch_ms):
    if epoch_ms is None:
        return None
    return datetime.fromtimestamp(epoch_ms / 1000, tz=timezone.utc)


def parse_feature_to_staging_row(feature: dict) -> dict:
    """Tomo un 'feature' GeoJSON crudo y devuelvo un dict con los campos tipados de staging."""
    props = feature.get("properties", {})
    geometry = feature.get("geometry", {})
    coords = geometry.get("coordinates", [None, None, None])
    longitude, latitude, depth_km = (coords + [None, None, None])[:3]

    return {
        "id": feature["id"],
        "mag": props.get("mag"),
        "place": props.get("place"),
        "event_time": _epoch_ms_to_datetime(props.get("time")),
        "updated_at": _epoch_ms_to_datetime(props.get("updated")),
        "tsunami": bool(props.get("tsunami")),
        "sig": props.get("sig"),
        "status": props.get("status"),
        "mag_type": props.get("magType"),
        "event_type": props.get("type"),
        "url": props.get("url"),
        "longitude": longitude,
        "latitude": latitude,
        "depth_km": depth_km,
    }
