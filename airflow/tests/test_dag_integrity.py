"""Pruebo que todos mis DAGs se importan sin errores. Si uno falla, Airflow ni lo muestra en su UI."""
from airflow.models import DagBag


def test_no_import_errors():
    dag_bag = DagBag(dag_folder="dags", include_examples=False)
    assert dag_bag.import_errors == {}, f"Tengo DAGs con errores de importación: {dag_bag.import_errors}"


def test_dags_loaded():
    dag_bag = DagBag(dag_folder="dags", include_examples=False)
    expected_dags = {"ingest_usgs", "transform_and_validate", "backfill_historical", "daily_ai_report"}
    assert expected_dags.issubset(set(dag_bag.dags.keys()))
