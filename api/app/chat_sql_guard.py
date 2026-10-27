"""Reviso que cualquier SQL que genere mi IA sea de solo lectura y toque únicamente curated.

Esta es mi segunda barrera de seguridad: aunque la valide aquí, mi rol reader en Postgres
tampoco tiene permiso de escritura ni de leer otros esquemas, así que un fallo en este
chequeo no se traduce en un daño real.
"""
import sqlglot
from sqlglot import exp

ALLOWED_SCHEMA = "curated"
MAX_ROWS = 200


class UnsafeSqlError(Exception):
    pass


def validate_and_cap(sql: str) -> str:
    try:
        parsed = sqlglot.parse_one(sql, dialect="postgres")
    except Exception as exc:
        raise UnsafeSqlError(f"No pude interpretar el SQL generado: {exc}")

    if not isinstance(parsed, exp.Select):
        raise UnsafeSqlError("Solo acepto consultas SELECT.")

    for table in parsed.find_all(exp.Table):
        schema = table.db or ALLOWED_SCHEMA
        if schema != ALLOWED_SCHEMA:
            raise UnsafeSqlError(f"Solo puedo consultar el esquema '{ALLOWED_SCHEMA}', no '{schema}'.")

    if not parsed.args.get("limit"):
        parsed = parsed.limit(MAX_ROWS)

    return parsed.sql(dialect="postgres")
