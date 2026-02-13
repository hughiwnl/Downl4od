/**
 * API client — all fetch calls to the backend live here.
 * In dev, Vite proxies /api to the backend. In production, Nginx handles it.
 */

import type { VideoInfo, DownloadRecord } from "../types";

const BASE = "/api";

/** POST /api/extract — send a URL, get back video metadata and format options. */
export async function extractVideoInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${BASE}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Extraction failed" }));
    throw new Error(err.detail || "Extraction failed");
  }
  return res.json();
}

/** POST /api/downloads — start downloading a video in the chosen format. */
export async function startDownload(
  url: string,
  formatId: string
): Promise<DownloadRecord> {
  const res = await fetch(`${BASE}/downloads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format_id: formatId }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Download failed to start" }));
    throw new Error(err.detail || "Download failed to start");
  }
  return res.json();
}

/** Build the URL to download the finished file (triggers browser save dialog). */
export function getFileUrl(id: string): string {
  return `${BASE}/downloads/${id}/file`;
}

/** Build the SSE endpoint URL for real-time progress streaming. */
export function getProgressUrl(id: string): string {
  return `${BASE}/downloads/${id}/progress`;
}
