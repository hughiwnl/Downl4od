"""
FastAPI app entry point.
Sets up CORS, registers routers, and ensures the downloads directory exists on startup.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import downloads, events


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the downloads directory if it doesn't exist yet
    os.makedirs(settings.DOWNLOADS_DIR, exist_ok=True)
    yield


app = FastAPI(title="Downl4od - Universal Video Downloader", lifespan=lifespan)

# Allow the frontend (running on a different port in dev) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /api/extract, /api/downloads, /api/downloads/{id}/file
app.include_router(downloads.router)
# /api/downloads/{id}/progress (SSE)
app.include_router(events.router)
