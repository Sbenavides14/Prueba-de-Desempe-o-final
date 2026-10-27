"""Redacto en lenguaje natural el resultado de mi consulta, validando que no invente cifras."""
import json
import re
from pathlib import Path

from app.ollama_client import generate

PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "chat_answer_prompt.txt"


def _extract_numbers(value) -> list[str]:
    """Saco todos los números que aparecen en mis resultados, para verificar que la IA no invente otros."""
    numbers = []
    if isinstance(value, dict):
        for v in value.values():
            numbers.extend(_extract_numbers(v))
    elif isinstance(value, list):
        for v in value:
            numbers.extend(_extract_numbers(v))
    elif isinstance(value, (int, float)):
        numbers.append(str(value))
    return numbers


def _fallback_text(rows: list[dict]) -> str:
    """Si mi IA falla o inventa cifras, devuelvo los datos crudos en vez de arriesgarme."""
    if not rows:
        return "No encontré resultados para tu pregunta."
    return "Esto es lo que encontré: " + json.dumps(rows, ensure_ascii=False, default=str)


def build_natural_answer(question: str, rows: list[dict]) -> dict:
    resultados_json = json.dumps(rows, ensure_ascii=False, default=str)
    prompt = PROMPT_PATH.read_text().format(question=question, resultados_json=resultados_json)

    try:
        result = generate(prompt)
    except Exception:
        return {"respuesta": _fallback_text(rows), "model": "fallback-template", "tokens": 0, "latency_ms": 0}

    expected_numbers = _extract_numbers(rows)
    text_numbers = set(re.findall(r"-?\d+\.?\d*", result["text"]))
    numbers_ok = all(
        num in result["text"] or num.rstrip("0").rstrip(".") in text_numbers
        for num in expected_numbers
    )

    if not numbers_ok:
        return {"respuesta": _fallback_text(rows), "model": result["model"], "tokens": result["tokens"], "latency_ms": result["latency_ms"]}

    return {"respuesta": result["text"], "model": result["model"], "tokens": result["tokens"], "latency_ms": result["latency_ms"]}
