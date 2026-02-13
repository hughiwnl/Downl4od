"""
Redis helpers for ephemeral job state and real-time progress.

Two key types are stored in Redis:
  - dl:job:{id}      — Full job state (status, filename, error, etc.). Used by REST endpoints.
  - dl:progress:{id} — Latest progress snapshot. Also published via Pub/Sub for SSE streaming.

Both auto-expire after 10 minutes (JOB_TTL) so nothing persists.
"""

import json

import redis

from app.config import settings

JOB_TTL = 600  # 10 minutes

redis_client = redis.Redis.from_url(settings.REDIS_URL)


def set_progress(download_id: str, data: dict) -> None:
    """Save a progress snapshot AND publish it to Pub/Sub for real-time SSE delivery."""
    payload = json.dumps(data)
    redis_client.set(f"dl:progress:{download_id}", payload, ex=JOB_TTL)
    redis_client.publish(f"dl:progress:{download_id}", payload)


def get_progress(download_id: str) -> dict | None:
    """Get the latest progress snapshot (for clients that connect late)."""
    raw = redis_client.get(f"dl:progress:{download_id}")
    if raw:
        return json.loads(raw)
    return None


def set_job(download_id: str, data: dict) -> None:
    """Save the full job state (used by REST endpoints like GET /api/downloads/{id})."""
    redis_client.set(f"dl:job:{download_id}", json.dumps(data), ex=JOB_TTL)


def get_job(download_id: str) -> dict | None:
    """Retrieve the full job state."""
    raw = redis_client.get(f"dl:job:{download_id}")
    if raw:
        return json.loads(raw)
    return None


def delete_job(download_id: str) -> None:
    """Immediately remove all data for a job (called after the user downloads the file)."""
    redis_client.delete(f"dl:job:{download_id}")
    redis_client.delete(f"dl:progress:{download_id}")
