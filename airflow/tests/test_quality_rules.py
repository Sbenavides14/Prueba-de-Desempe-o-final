"""Pruebo una de mis reglas de calidad: un caso válido debe pasar, uno inválido debe rechazarse."""
import pandas as pd

from include.quality.validate import validate_rows

VALID_ROW = {
    "id": "us1",
    "mag": 4.5,
    "place": "Test place",
    "event_time": pd.Timestamp("2026-01-01", tz="UTC"),
    "updated_at": pd.Timestamp("2026-01-01", tz="UTC"),
    "tsunami": False,
    "sig": 300,
    "status": "reviewed",
    "mag_type": "mw",
    "event_type": "earthquake",
    "url": "https://example.com",
    "longitude": -70.0,
    "latitude": 10.0,
    "depth_km": 15.0,
}

INVALID_ROW = {**VALID_ROW, "id": "us2", "latitude": 999.0}  # fuera de rango, debe rechazarse


def test_valid_row_is_approved():
    df = pd.DataFrame([VALID_ROW])
    approved, rejected = validate_rows(df)

    assert len(approved) == 1
    assert len(rejected) == 0


def test_invalid_row_is_rejected():
    df = pd.DataFrame([INVALID_ROW])
    approved, rejected = validate_rows(df)

    assert len(approved) == 0
    assert len(rejected) == 1
    assert rejected[0]["id"] == "us2"
