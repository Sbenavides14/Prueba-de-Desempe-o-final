"""Me conecto a Postgres siempre con mi rol reader: solo puede leer curated y app.users."""
import os
import psycopg2
import psycopg2.extras


def get_connection():
    return psycopg2.connect(
        host=os.environ["APP_DB_HOST"],
        port=os.environ["APP_DB_PORT"],
        dbname=os.environ["APP_DB_NAME"],
        user=os.environ["READER_DB_USER"],
        password=os.environ["READER_DB_PASSWORD"],
    )


def query(sql: str, params: tuple = ()) -> list[dict]:
    """Corro una consulta de solo lectura y devuelvo las filas como diccionarios."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
