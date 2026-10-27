"""Hablo con la API pública de USGS desde aquí, nunca directo desde el archivo del DAG."""
import requests

from include.net_ipv4_only import enforce_ipv4_only

enforce_ipv4_only()

# Si USGS no responde en 10 segundos, prefiero fallar rápido y dejar que Airflow reintente,
# en vez de dejar la tarea colgada indefinidamente.
REQUEST_TIMEOUT_SECONDS = 10


def fetch_geojson(url: str) -> dict:
    """Traigo el feed de USGS. Si la respuesta no es 200 o el cuerpo no es JSON válido, lanzo error."""
    response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    payload = response.json()

    if "features" not in payload:
        raise ValueError(f"Espero una clave 'features' en la respuesta de USGS y no la encontré: {url}")

    return payload
