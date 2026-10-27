"""Armo el reporte diario: le pido al LLM que redacte, pero yo controlo que no haya inventado cifras."""
from pathlib import Path

from include.ai.ollama_client import generate
from include.ai.report_stats import ReportStats

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "daily_report_prompt.txt"


def _numbers_match(text: str, stats: ReportStats) -> bool:
    """Reviso que las cifras clave que calculé aparezcan tal cual en el texto que redactó el LLM."""
    if str(stats.total_eventos) not in text:
        return False
    if stats.magnitud_maxima is not None and f"{stats.magnitud_maxima:.1f}" not in text and str(stats.magnitud_maxima) not in text:
        return False
    return True


def _fallback_text(stats: ReportStats) -> str:
    """Si mi IA falla o inventa cifras, uso esta plantilla fija en vez de romper el pipeline."""
    tsunami_txt = "sí hubo alerta de tsunami" if stats.hubo_alerta_tsunami else "no hubo alertas de tsunami"
    region_txt = stats.region_mas_activa or "sin región destacada"
    mag_txt = f"{stats.magnitud_maxima}" if stats.magnitud_maxima is not None else "sin datos"
    return (
        f"En las últimas 24 horas registré {stats.total_eventos} eventos sísmicos. "
        f"La magnitud máxima fue {mag_txt}, con mayor actividad en {region_txt}. "
        f"En este periodo {tsunami_txt}. (Reporte generado en modo automático por falla del modelo de IA)."
    )


def build_daily_report(stats: ReportStats) -> dict:
    """Devuelvo el texto final y si usé la IA o mi plan alterno, para dejarlo trazado."""
    prompt_template = PROMPT_PATH.read_text()
    prompt = prompt_template.format(stats_json=stats.model_dump_json())

    try:
        result = generate(prompt)
    except Exception:
        return {
            "text": _fallback_text(stats),
            "model": "fallback-template",
            "tokens": 0,
            "latency_ms": 0,
            "used_fallback": True,
        }

    if not _numbers_match(result["text"], stats):
        return {
            "text": _fallback_text(stats),
            "model": result["model"],
            "tokens": result["tokens"],
            "latency_ms": result["latency_ms"],
            "used_fallback": True,
        }

    result["used_fallback"] = False
    return result
