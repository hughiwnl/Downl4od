// TypeScript interfaces matching the backend Pydantic schemas.
// These define the shape of data exchanged between frontend and backend.

// A single format/quality option (e.g. "1080p mp4", "audio only m4a")
export interface FormatInfo {
  format_id: string;
  ext: string;
  quality_label: string;
  filesize_approx: number | null;
  has_video: boolean;
  has_audio: boolean;
  note: string;
}

// Video metadata returned by POST /api/extract
export interface VideoInfo {
  url: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  formats: FormatInfo[];
}

// Download job state returned by POST/GET /api/downloads
export interface DownloadRecord {
  id: string;
  url: string;
  title: string | null;
  format_id: string | null;
  filename: string | null;
  filesize: number | null;
  status: "pending" | "downloading" | "processing" | "completed" | "failed";
  progress: number;
  error_message: string | null;
}

// Real-time progress data received via SSE from GET /api/downloads/{id}/progress
export interface ProgressEvent {
  status: string;
  progress: number;
  downloaded_bytes?: number;
  total_bytes?: number;
  speed?: number;       // bytes per second
  eta?: number;         // estimated seconds remaining
  error?: string;
  filename?: string;
}
