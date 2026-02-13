"""
SSE (Server-Sent Events) endpoint for real-time download progress.

The frontend opens an EventSource connection to this endpoint. The server subscribes
to a Redis Pub/Sub channel and forwards progress updates as SSE events. This gives
the user a live progress bar, download speed, and ETA without polling.
"""

import asyncio
import json

import redis.asyncio as aioredis
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.config import settings

router = APIRouter(prefix="/api")


@router.get("/downloads/{download_id}/progress")
async def download_progress(download_id: str):
    """Stream real-time progress events for a download via SSE."""

    async def event_generator():
        r = aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.subscribe(f"dl:progress:{download_id}")

        # Send the latest snapshot immediately so late-connecting clients catch up
        current = await r.get(f"dl:progress:{download_id}")
        if current:
            yield {"event": "progress", "data": current.decode()}

        try:
            while True:
                # Wait for new messages published by the Celery worker
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                )
                if message and message["type"] == "message":
                    data = json.loads(message["data"])
                    yield {"event": "progress", "data": json.dumps(data)}

                    # Stop streaming once download finishes or fails
                    if data.get("status") in ("completed", "failed"):
                        break
                else:
                    # Send a heartbeat to keep the connection alive
                    yield {"event": "heartbeat", "data": ""}

                await asyncio.sleep(0.5)
        finally:
            await pubsub.unsubscribe(f"dl:progress:{download_id}")
            await r.aclose()

    return EventSourceResponse(event_generator())
