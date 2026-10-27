"""Defino aquí mis reglas de calidad. Si una fila no las cumple, nunca llega a curated."""
import pandera as pa
from pandera import Column, Check

staging_schema = pa.DataFrameSchema(
    columns={
        "id": Column(str, nullable=False, unique=True),
        "mag": Column(float, Check.in_range(-2, 10), nullable=True),
        "place": Column(str, nullable=True),
        "event_time": Column("datetime64[ns, UTC]", nullable=False),
        "updated_at": Column("datetime64[ns, UTC]", nullable=False),
        "tsunami": Column(bool, nullable=True),
        "sig": Column(float, nullable=True),
        "status": Column(str, nullable=True),
        "mag_type": Column(str, nullable=True),
        "event_type": Column(str, nullable=True),
        "url": Column(str, nullable=True),
        "longitude": Column(float, Check.in_range(-180, 180), nullable=False),
        "latitude": Column(float, Check.in_range(-90, 90), nullable=False),
        "depth_km": Column(float, Check.in_range(-10, 800), nullable=True),
    },
    strict=False,
    coerce=True,
)
