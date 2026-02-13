"""
Pydantic schemas for API request/response validation.
These define the shape of data flowing between the frontend and backend.
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional


# --- Request schemas ---

class ExtractRequest(BaseModel):
    """POST /api/extract — user submits a video URL to extract metadata."""
    url: HttpUrl


class StartDownloadRequest(BaseModel):
    """POST /api/downloads — user picks a format and starts downloading."""
    url: HttpUrl
    format_id: str


# --- Data schemas ---

class FormatInfo(BaseModel):
    """A single downloadable format/quality option returned by yt-dlp."""
    format_id: str                         # yt-dlp's internal format identifier
    ext: str                               # File extension (mp4, webm, m4a, etc.)
    quality_label: str                     # Human-readable label ("1080p", "audio only")
    height: int = 0                        # Video height in pixels (for sorting, 0 for audio)
    filesize_approx: Optional[int] = None  # Estimated file size in bytes
    has_video: bool
    has_audio: bool
    note: str                              # Extra info from yt-dlp (codec, bitrate, etc.)


class VideoInfo(BaseModel):
    """Extracted metadata for a video — returned by POST /api/extract."""
    url: str
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None         # Duration in seconds
    uploader: Optional[str] = None
    formats: list[FormatInfo]              # Available quality/format options


# --- Response schemas ---

class DownloadResponse(BaseModel):
    """Current state of a download job — returned by POST and GET /api/downloads."""
    id: str
    url: str
    title: Optional[str] = None
    format_id: Optional[str] = None
    filename: Optional[str] = None         # Set once download completes
    filesize: Optional[int] = None
    status: str                            # pending | downloading | processing | completed | failed
    progress: float                        # 0-100
    error_message: Optional[str] = None
