"""Limpio cualquier texto antes de mandarlo a mi LLM, para mitigar inyección de instrucciones."""
import re

MAX_LENGTH = 500


def sanitize_for_llm(text: str) -> str:
    if not text:
        return ""
    # Corto el texto: una pregunta o un campo "place" nunca debería ser enorme.
    text = text[:MAX_LENGTH]
    # Quito caracteres de control y marcas típicas de intentos de "romper" mi prompt.
    text = re.sub(r"[\x00-\x1f\x7f]", "", text)
    text = text.replace("```", "").replace("{", "").replace("}", "")
    return text.strip()
