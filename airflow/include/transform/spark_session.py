"""Abro aquí mi sesión de Spark, siempre en modo local: no necesito un cluster para este volumen de datos."""
from pyspark.sql import SparkSession


def get_local_spark(app_name: str) -> SparkSession:
    return (
        SparkSession.builder
        .appName(app_name)
        .master("local[*]")
        .config("spark.driver.memory", "1g")
        .config("spark.ui.enabled", "false")
        .getOrCreate()
    )
