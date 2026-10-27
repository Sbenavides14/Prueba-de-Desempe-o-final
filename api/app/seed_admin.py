"""Siembro mi usuario admin al arrancar, leyendo la contraseña desde variables de entorno.

Nunca escribo una contraseña en el código: la tomo de APP_ADMIN_EMAIL/APP_ADMIN_PASSWORD.
Uso el rol transformer solo para este insert puntual, porque mi rol reader no puede escribir.
"""
import os

import psycopg2
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin_user() -> None:
    email = os.environ["APP_ADMIN_EMAIL"]
    password = os.environ["APP_ADMIN_PASSWORD"]
    password_hash = pwd_context.hash(password)

    conn = psycopg2.connect(
        host=os.environ["APP_DB_HOST"],
        port=os.environ["APP_DB_PORT"],
        dbname=os.environ["APP_DB_NAME"],
        user=os.environ["TRANSFORMER_DB_USER"],
        password=os.environ["TRANSFORMER_DB_PASSWORD"],
    )
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app.users (email, password_hash, role)
                VALUES (%s, %s, 'admin')
                ON CONFLICT (email) DO NOTHING
                """,
                (email, password_hash),
            )
    finally:
        conn.close()
