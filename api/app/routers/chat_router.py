"""Mi chat en lenguaje natural: primero clasifico la intención, y solo genero SQL si es una pregunta de datos."""
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import require_role
from app.sanitize import sanitize_for_llm
from app.ollama_client import generate
from app.chat_sql_guard import validate_and_cap, UnsafeSqlError
from app.chat_answer_builder import build_natural_answer
from app.db import query
from app.ai_log import log_ai_run

router = APIRouter(prefix="/api", tags=["chat"])

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"
INTENT_PROMPT_PATH = PROMPTS_DIR / "chat_intent_prompt.txt"
SQL_PROMPT_PATH = PROMPTS_DIR / "chat_sql_prompt.txt"

GREETING_REPLY = "¡Hola! Soy el asistente de datos de SismoWatch. Pregúntame cosas sobre los sismos registrados: magnitudes, regiones, fechas o conteos."
OFF_TOPIC_REPLY = "No estoy hecho para eso: solo puedo responder preguntas sobre los datos sísmicos de SismoWatch. Pregúntame, por ejemplo, por la magnitud máxima o cuántos eventos hubo en cierta región."

# Reconozco los saludos más comunes sin gastar una llamada al modelo: son el caso
# más frecuente del chat, y esperar 10+ segundos solo para decir "hola" es mal servicio.
_GREETING_PATTERN = re.compile(
    r"^\s*(hola+|hey|buenas|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|qu[eé]\s+tal|c[oó]mo\s+(est[aá]s|vas)|saludos)[\s!¡.,]*$",
    re.IGNORECASE,
)


def _is_simple_greeting(question: str) -> bool:
    return bool(_GREETING_PATTERN.match(question))


class ChatRequest(BaseModel):
    question: str


def _classify_intent(question: str) -> str:
    """Pido una clasificación corta antes de decidir si genero SQL o respondo directo."""
    prompt = INTENT_PROMPT_PATH.read_text().format(question=question)
    result = generate(prompt)
    text = result["text"].strip().upper()

    if "SALUDO" in text:
        intent = "SALUDO"
    elif "FUERA_DE_TEMA" in text:
        intent = "FUERA_DE_TEMA"
    else:
        intent = "DATOS"

    return intent, result


@router.post("/chat")
def chat(body: ChatRequest, user: dict = Depends(require_role("viewer", "admin"))):
    question = sanitize_for_llm(body.question)
    if not question:
        raise HTTPException(status_code=400, detail="Tu pregunta llegó vacía después de sanitizarla.")

    if _is_simple_greeting(question):
        return {"respuesta": GREETING_REPLY, "sql_ejecutado": None, "resultados": None}

    try:
        intent, intent_result = _classify_intent(question)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Mi modelo de IA no respondió: {exc}")

    log_ai_run(run_type="chat_intent", model=intent_result["model"], tokens=intent_result["tokens"], latency_ms=intent_result["latency_ms"])

    if intent == "SALUDO":
        return {"respuesta": GREETING_REPLY, "sql_ejecutado": None, "resultados": None}

    if intent == "FUERA_DE_TEMA":
        return {"respuesta": OFF_TOPIC_REPLY, "sql_ejecutado": None, "resultados": None}

    prompt = SQL_PROMPT_PATH.read_text().format(question=question)

    try:
        result = generate(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Mi modelo de IA no respondió: {exc}")

    try:
        safe_sql = validate_and_cap(result["text"])
    except UnsafeSqlError as exc:
        raise HTTPException(status_code=422, detail=f"Rechacé el SQL que generó mi IA: {exc}")

    try:
        rows = query(safe_sql)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mi consulta a la base de datos falló: {exc}")

    log_ai_run(run_type="chat", model=result["model"], tokens=result["tokens"], latency_ms=result["latency_ms"])

    answer = build_natural_answer(question, rows)
    log_ai_run(run_type="chat_answer", model=answer["model"], tokens=answer["tokens"], latency_ms=answer["latency_ms"])

    return {"respuesta": answer["respuesta"], "sql_ejecutado": safe_sql, "resultados": rows}
