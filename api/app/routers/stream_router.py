"""Empujo eventos nuevos al cliente por SSE, revisando mi base cada pocos segundos."""
import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from app.auth import decode_token
from app.db import query

router = APIRouter(prefix="/api", tags=["stream"])

POLL_INTERVAL_SECONDS = 5


@router.get("/stream")
async def stream_events(request: Request, token: str):
    # EventSource del navegador no puede mandar cabeceras, por eso aquí recibo
    # el token por query param en vez de por Authorization. Igual lo valido siempre.
    user = decode_token(token)
    if user["role"] not in ("viewer", "admin"):
        raise HTTPException(status_code=403, detail="Tu rol no tiene permiso para esta acción.")
    async def event_generator():
        last_seen = None
        while True:
            if await request.is_disconnected():
                break

            sql = "SELECT id, mag, place, event_time, tsunami FROM curated.earthquake_events"
            params: tuple = ()
            if last_seen:
                sql += " WHERE ingested_at > %s"
                params = (last_seen,)
            sql += " ORDER BY ingested_at DESC LIMIT 50"

            rows = query(sql, params)
            if rows:
                last_seen_rows = query("SELECT max(ingested_at) AS t FROM curated.earthquake_events")
                last_seen = last_seen_rows[0]["t"] if last_seen_rows else last_seen
                yield {"event": "new_events", "data": json.dumps(rows, default=str)}
            else:
                yield {"event": "heartbeat", "data": "{}"}

            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    return EventSourceResponse(event_generator())
