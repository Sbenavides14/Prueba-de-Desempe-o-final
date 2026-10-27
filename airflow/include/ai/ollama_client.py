"""Hablo con mi modelo de IA local (Ollama) desde aquí, nunca desde el archivo del DAG."""
import os
import time

import requests

from include.net_ipv4_only import enforce_ipv4_only

enforce_ipv4_only()

REQUEST_TIMEOUT_SECONDS = 60


def generate(prompt: str) -> dict:
    """Pido una generación de texto y devuelvo el texto junto con métricas de la llamada.

    Si Ollama no responde o se cae, dejo que la excepción suba: quien me llama decide
    el plan alterno (por ejemplo, guardar un reporte degradado en vez de romper el DAG).
    """
    host = os.environ["OLLAMA_HOST"]
    model = os.environ["OLLAMA_MODEL"]

    started = time.monotonic()
    response = requests.post(
        f"{host}/api/generate",
        # Le pido a Ollama que descargue el modelo de la RAM si pasan 3 min sin usarlo:
        # cada instancia ocupa varios GB, y no quiero pagar ese costo en reposo.
        json={"model": model, "prompt": prompt, "stream": False, "keep_alive": "3m"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    body = response.json()
    latency_ms = int((time.monotonic() - started) * 1000)

    return {
        "text": body.get("response", "").strip(),
        "model": model,
        "tokens": body.get("eval_count", 0) + body.get("prompt_eval_count", 0),
        "latency_ms": latency_ms,
    }
