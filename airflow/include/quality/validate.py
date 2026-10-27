"""Separo mis filas en 'aprobadas' y 'rechazadas', usando mi esquema de Pandera."""
import pandas as pd
import pandera as pa

from include.quality.schema import staging_schema


def validate_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Devuelvo (filas_aprobadas, lista_de_rechazos_con_motivo).

    Uso lazy=True para que Pandera no se detenga en el primer error: quiero saber
    exactamente qué filas fallaron y por qué, no solo que "algo" falló.
    """
    try:
        staging_schema.validate(df, lazy=True)
        return df, []
    except pa.errors.SchemaErrors as exc:
        failure_cases = exc.failure_cases
        bad_indexes = set(failure_cases["index"].dropna().astype(int))

        rejected = []
        for idx in bad_indexes:
            motivos = failure_cases[failure_cases["index"] == idx]["check"].tolist()
            rejected.append({
                "id": df.loc[idx, "id"] if "id" in df.columns else None,
                "motivo": ", ".join(str(m) for m in motivos),
                "raw_payload": df.loc[idx].to_dict(),
            })

        approved = df.drop(index=list(bad_indexes))
        return approved, rejected
