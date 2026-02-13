"""
Celery instance configuration.

Celery is the task queue that runs video downloads in a separate worker process.
This keeps the FastAPI server responsive — downloads happen in the background.
Redis is used as both the message broker (task queue) and result backend.
"""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "dl_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.download_task"],  # tells Celery where to find task functions
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    worker_concurrency=settings.MAX_CONCURRENT_DOWNLOADS,  # max simultaneous downloads
    task_acks_late=True,  # only acknowledge task after it completes (prevents losing tasks on crash)
)
