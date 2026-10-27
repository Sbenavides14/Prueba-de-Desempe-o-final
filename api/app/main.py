"""Arranco aquí mi api: configuro CORS, registro mis rutas y siembro mi usuario admin."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.seed_admin import seed_admin_user
from app.routers import (
    auth_router,
    kpis_router,
    events_router,
    reports_router,
    pipeline_router,
    admin_router,
    stream_router,
    chat_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_admin_user()
    yield


app = FastAPI(title="SismoWatch API", lifespan=lifespan)

# Solo dejo entrar a mi propio frontend, nunca abro esto a cualquier origen.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router.router)
app.include_router(kpis_router.router)
app.include_router(events_router.router)
app.include_router(reports_router.router)
app.include_router(pipeline_router.router)
app.include_router(admin_router.router)
app.include_router(stream_router.router)
app.include_router(chat_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
