"""Centralizo aquí cómo me conecto a mi base de datos, para no repetir esta lógica en cada tarea."""
import os
import psycopg2


def get_connection(db_user_env: str, db_password_env: str):
    """Abro una conexión usando el rol que le paso (ingestor, transformer, etc.), nunca el superusuario."""
    return psycopg2.connect(
        host=os.environ["APP_DB_HOST"],
        port=os.environ["APP_DB_PORT"],
        dbname=os.environ["APP_DB_NAME"],
        user=os.environ[db_user_env],
        password=os.environ[db_password_env],
    )
