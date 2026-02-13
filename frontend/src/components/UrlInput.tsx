/**
 * URL input form — the first thing the user sees.
 * User pastes a video URL and clicks "Get Video" to extract metadata.
 */

import { useState } from "react";

interface Props {
  onSubmit: (url: string) => void;  // called with the URL when the form is submitted
  loading: boolean;                  // true while extracting — disables the form
}

export function UrlInput({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form className="url-input" onSubmit={handleSubmit}>
      <div className="url-input-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a video URL here..."
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
          {loading ? "Extracting..." : "Get Video"}
        </button>
      </div>
    </form>
  );
}
