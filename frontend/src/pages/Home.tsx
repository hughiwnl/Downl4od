/**
 * Main (and only) page — orchestrates the entire download workflow.
 *
 * Uses a simple state machine with 5 phases:
 *   idle → extracting → selecting → downloading → done
 *
 * Each phase shows different components:
 *   idle/extracting: UrlInput (paste a URL)
 *   selecting:       VideoPreview + FormatSelector + DownloadButton
 *   downloading:     DownloadCard with live progress bar
 *   done:            DownloadCard with "Save to PC" button
 */

import { useEffect, useRef, useState } from "react";
import type { DownloadRecord } from "../types";
import { startDownload } from "../api/client";
import { useVideoInfo } from "../hooks/useVideoInfo";
import { useDownloadProgress } from "../hooks/useDownloadProgress";
import { UrlInput } from "../components/UrlInput";
import { VideoPreview } from "../components/VideoPreview";
import { FormatSelector } from "../components/FormatSelector";
import { DownloadButton } from "../components/DownloadButton";
import { DownloadCard } from "../components/DownloadCard";

type Phase = "idle" | "extracting" | "selecting" | "downloading" | "done";

export function Home() {
  const { videoInfo, loading: extracting, error: extractError, extract, reset } = useVideoInfo();

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<DownloadRecord | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time progress updates via SSE (only while downloading)
  const progress = useDownloadProgress(
    activeDownload && phase === "downloading" ? activeDownload.id : null
  );

  // Move to "done" phase when SSE reports completed or failed
  const prevProgressStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!progress) return;
    if (prevProgressStatus.current === progress.status) return;
    prevProgressStatus.current = progress.status;

    if (
      (progress.status === "completed" || progress.status === "failed") &&
      phase === "downloading"
    ) {
      setPhase("done");
    }
  }, [progress, phase]);

  // Step 1: User submits a URL → extract video metadata
  const handleExtract = async (url: string) => {
    setPhase("extracting");
    setError(null);
    setSelectedFormat(null);
    setActiveDownload(null);
    await extract(url);
    setPhase("selecting");
  };

  // Step 2: User picks a format and clicks Download → start the Celery task
  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return;
    setDownloadLoading(true);
    setError(null);
    try {
      const record = await startDownload(videoInfo.url, selectedFormat);
      setActiveDownload(record);
      setPhase("downloading");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start download");
    } finally {
      setDownloadLoading(false);
    }
  };

  // Step 3: After saving, reset everything so the user can download another video
  const handleNewDownload = () => {
    reset();
    setPhase("idle");
    setSelectedFormat(null);
    setActiveDownload(null);
    setError(null);
  };

  return (
    <div className="home">
      <header className="header">
        <h1>DL</h1>
        <p className="subtitle">Download videos from anywhere. Nothing is tracked or stored.</p>
      </header>

      <main className="main">
        {(phase === "idle" || phase === "extracting" || phase === "selecting") && (
          <UrlInput onSubmit={handleExtract} loading={extracting} />
        )}

        {extractError && <div className="error-banner">{extractError}</div>}
        {error && <div className="error-banner">{error}</div>}

        {videoInfo && phase === "selecting" && (
          <div className="selection-section">
            <VideoPreview video={videoInfo} />
            <FormatSelector
              formats={videoInfo.formats}
              selected={selectedFormat}
              onSelect={setSelectedFormat}
            />
            <DownloadButton
              onClick={handleDownload}
              disabled={!selectedFormat}
              loading={downloadLoading}
            />
          </div>
        )}

        {activeDownload && (phase === "downloading" || phase === "done") && (
          <div className="active-download-section">
            <DownloadCard
              download={activeDownload}
              progress={progress}
              onSaved={handleNewDownload}
            />
          </div>
        )}
      </main>
    </div>
  );
}
