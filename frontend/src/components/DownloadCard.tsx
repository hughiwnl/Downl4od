/**
 * Shows the current state of a download — title, status badge, progress bar,
 * speed/ETA, and a "Save to PC" button when complete.
 *
 * After the user clicks "Save to PC", the file is downloaded via the browser
 * and onSaved is called to redirect back to the front page.
 */

import type { DownloadRecord, ProgressEvent } from "../types";
import { ProgressBar } from "./ProgressBar";
import { getFileUrl } from "../api/client";

interface Props {
  download: DownloadRecord;              // job state from the backend
  progress?: ProgressEvent | null;       // real-time SSE progress data
  onSaved: () => void;                   // called after user saves the file — resets to front page
}

function formatSpeed(bytesPerSec: number | undefined): string {
  if (!bytesPerSec) return "";
  if (bytesPerSec < 1024 * 1024)
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds: number | undefined): string {
  if (!seconds) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function DownloadCard({ download, progress, onSaved }: Props) {
  const isActive =
    download.status === "downloading" ||
    download.status === "processing" ||
    download.status === "pending";

  const currentProgress = progress?.progress ?? download.progress;
  const currentStatus = progress?.status ?? download.status;

  const handleSave = () => {
    // Trigger the file download via a temporary link
    const link = document.createElement("a");
    link.href = getFileUrl(download.id);
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Redirect back to front page after a short delay
    setTimeout(onSaved, 1000);
  };

  return (
    <div className={`download-card ${currentStatus}`}>
      <div className="download-card-header">
        <div className="download-card-info">
          <h4 className="download-card-title">
            {download.title || "Downloading..."}
          </h4>
          <div className="download-card-meta">
            <span className={`status-badge ${currentStatus}`}>
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="download-card-progress">
          <ProgressBar progress={currentProgress} status={currentStatus} />
          {progress && (
            <div className="progress-details">
              {progress.speed ? (
                <span>{formatSpeed(progress.speed)}</span>
              ) : null}
              {progress.eta ? (
                <span>ETA: {formatEta(progress.eta)}</span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {currentStatus === "completed" && (
        <div className="download-card-actions">
          <button onClick={handleSave} className="btn-primary btn-save">
            Save to PC
          </button>
        </div>
      )}

      {currentStatus === "failed" && download.error_message && (
        <p className="download-error">{download.error_message}</p>
      )}
    </div>
  );
}
