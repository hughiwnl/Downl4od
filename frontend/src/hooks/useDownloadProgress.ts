/**
 * Hook that opens an SSE (Server-Sent Events) connection to stream
 * real-time download progress from the backend.
 *
 * Pass a downloadId to start listening, or null to disconnect.
 * Returns the latest ProgressEvent (percent, speed, ETA, status).
 */

import { useEffect, useRef, useState } from "react";
import type { ProgressEvent } from "../types";
import { getProgressUrl } from "../api/client";

export function useDownloadProgress(downloadId: string | null) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!downloadId) {
      setProgress(null);
      return;
    }

    // Open an SSE connection to GET /api/downloads/{id}/progress
    const es = new EventSource(getProgressUrl(downloadId));
    eventSourceRef.current = es;

    // Listen for "progress" events published by the Celery worker via Redis
    es.addEventListener("progress", (e) => {
      const data: ProgressEvent = JSON.parse(
        (e as MessageEvent).data
      );
      setProgress(data);

      // Close the connection once the download is done (no more events coming)
      if (data.status === "completed" || data.status === "failed") {
        es.close();
      }
    });

    // Heartbeats keep the connection alive — nothing to do with them
    es.addEventListener("heartbeat", () => {});

    es.onerror = () => {};

    // Cleanup: close the SSE connection when the component unmounts or downloadId changes
    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [downloadId]);

  return progress;
}
