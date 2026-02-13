"""
yt-dlp wrapper — the core video engine.

Two functions:
  1. extract_info(url)  — fetches video metadata + available formats without downloading
  2. download_video()   — downloads a video in the chosen format, calling progress_callback as it goes
"""

import os

import yt_dlp

from app.schemas import FormatInfo, VideoInfo


def extract_info(url: str) -> VideoInfo:
    """Extract video metadata and available formats from a URL using yt-dlp.
    Does NOT download the video — just reads what's available."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    # Parse yt-dlp's raw format list into our simplified FormatInfo objects.
    # Deduplicate by (quality, extension, video/audio) to avoid showing redundant options.
    formats = []
    seen = set()

    for f in info.get("formats", []):
        if not f.get("url"):
            continue

        has_video = f.get("vcodec", "none") != "none"
        has_audio = f.get("acodec", "none") != "none"

        if has_video:
            height = f.get("height", 0)
            label = f"{height}p" if height else f.get("format_note", "unknown")
        elif has_audio:
            label = "audio only"
        else:
            continue  # skip formats with neither video nor audio

        dedup_key = (label, f.get("ext"), has_video, has_audio)
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        formats.append(
            FormatInfo(
                format_id=f["format_id"],
                ext=f.get("ext", "unknown"),
                quality_label=label,
                filesize_approx=f.get("filesize") or f.get("filesize_approx"),
                has_video=has_video,
                has_audio=has_audio,
                note=f.get("format_note", ""),
            )
        )

    # Always offer "Best quality" as the first option — yt-dlp picks the best
    # video + audio streams and merges them with ffmpeg
    formats.insert(
        0,
        FormatInfo(
            format_id="bestvideo+bestaudio/best",
            ext="mp4",
            quality_label="Best quality",
            filesize_approx=None,
            has_video=True,
            has_audio=True,
            note="Best available video + audio merged",
        ),
    )

    return VideoInfo(
        url=url,
        title=info.get("title", "Unknown"),
        thumbnail=info.get("thumbnail"),
        duration=info.get("duration"),
        uploader=info.get("uploader"),
        formats=formats,
    )


def download_video(
    url: str, format_id: str, output_dir: str, progress_callback
) -> dict:
    """Download a video using yt-dlp. The progress_callback is called by yt-dlp
    during download with status updates (bytes downloaded, speed, ETA).
    Returns the filename, title, and file size of the downloaded file."""
    ydl_opts = {
        "format": format_id,
        "outtmpl": os.path.join(output_dir, "%(title)s [%(id)s].%(ext)s"),
        "progress_hooks": [progress_callback],       # yt-dlp calls this with download progress
        "merge_output_format": "mp4",                 # ffmpeg merges video+audio into mp4
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,                           # only download single video, not playlists
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        # After merging, the extension might change to .mp4
        if not os.path.exists(filename):
            base, _ = os.path.splitext(filename)
            filename = base + ".mp4"
        return {
            "filename": os.path.basename(filename),
            "title": info.get("title"),
            "filesize": os.path.getsize(filename) if os.path.exists(filename) else None,
        }
