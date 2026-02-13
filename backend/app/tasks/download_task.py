"""
Celery task that downloads a video using yt-dlp.

This runs in the Celery worker process (not the API server). It:
  1. Calls yt-dlp to download the video
  2. Publishes real-time progress updates to Redis (which the SSE endpoint streams to the browser)
  3. Updates the job state in Redis when done (or on failure)
"""

import time

from app.tasks.celery_app import celery_app
from app.services.ytdlp_service import download_video
from app.utils.progress import set_progress, get_job, set_job
from app.config import settings


@celery_app.task(bind=True, name="download_video")
def download_video_task(self, download_id: str, url: str, format_id: str):
    last_update = 0  # timestamp of last progress push — used for throttling

    try:
        # Mark the job as actively downloading
        job = get_job(download_id)
        if job:
            job["status"] = "downloading"
            set_job(download_id, job)

        def progress_callback(d):
            """Called by yt-dlp during download with status updates.
            Throttled to every 500ms to avoid flooding Redis/SSE."""
            nonlocal last_update
            now = time.time()

            if d["status"] == "downloading":
                if now - last_update < 0.5:
                    return  # skip — too soon since last update
                last_update = now

                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                pct = (downloaded / total * 100) if total > 0 else 0

                set_progress(download_id, {
                    "status": "downloading",
                    "progress": round(pct, 1),
                    "downloaded_bytes": downloaded,
                    "total_bytes": total,
                    "speed": d.get("speed", 0),
                    "eta": d.get("eta", 0),
                })

            elif d["status"] == "finished":
                # yt-dlp finished downloading — now ffmpeg is merging video+audio
                set_progress(download_id, {
                    "status": "processing",
                    "progress": 99.0,
                })

        # Actually download the video
        result = download_video(
            url, format_id, settings.DOWNLOADS_DIR, progress_callback
        )

        # Update job state to completed
        job = get_job(download_id)
        if job:
            job["status"] = "completed"
            job["filename"] = result["filename"]
            job["title"] = result.get("title") or job.get("title")
            job["filesize"] = result.get("filesize")
            job["progress"] = 100.0
            set_job(download_id, job)

        # Push final "completed" event so the frontend knows the download is ready
        set_progress(download_id, {
            "status": "completed",
            "progress": 100.0,
            "filename": result["filename"],
        })

        return {"download_id": download_id, "filename": result["filename"]}

    except Exception as e:
        # Mark job as failed and push error to the frontend
        job = get_job(download_id)
        if job:
            job["status"] = "failed"
            job["error_message"] = str(e)[:500]
            set_job(download_id, job)

        set_progress(download_id, {
            "status": "failed",
            "progress": 0,
            "error": str(e)[:500],
        })
        raise
