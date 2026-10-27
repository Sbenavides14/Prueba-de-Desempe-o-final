"""Pruebo que convierto un evento GeoJSON real de USGS en una fila de staging correcta."""
from include.transform.geojson_to_row import parse_feature_to_staging_row

SAMPLE_FEATURE = {
    "id": "us7000abcd",
    "properties": {
        "mag": 5.2,
        "place": "10 km SW of Loa, Hawaii",
        "time": 1700000000000,
        "updated": 1700000100000,
        "tsunami": 0,
        "sig": 416,
        "status": "reviewed",
        "magType": "mw",
        "type": "earthquake",
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
    },
    "geometry": {"coordinates": [-155.6, 19.5, 10.3]},
}


def test_parse_feature_to_staging_row():
    row = parse_feature_to_staging_row(SAMPLE_FEATURE)

    assert row["id"] == "us7000abcd"
    assert row["mag"] == 5.2
    assert row["place"] == "10 km SW of Loa, Hawaii"
    assert row["tsunami"] is False
    assert row["longitude"] == -155.6
    assert row["latitude"] == 19.5
    assert row["depth_km"] == 10.3
    assert row["event_time"].year == 2023
