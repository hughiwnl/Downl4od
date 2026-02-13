import type { FormatInfo } from "../types";

interface Props {
  formats: FormatInfo[];
  selected: string | null;
  onSelect: (formatId: string) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatLabel(f: FormatInfo): string {
  const size = f.filesize_approx ? ` - ${formatFileSize(f.filesize_approx)}` : "";
  return `${f.quality_label} (${f.ext})${size}`;
}

export function FormatSelector({ formats, selected, onSelect }: Props) {
  const videoFormats = formats.filter((f) => f.has_video);
  const audioFormats = formats.filter((f) => !f.has_video && f.has_audio);

  return (
    <div className="format-selector">
      <label className="format-label" htmlFor="format-select">
        Quality
      </label>
      <select
        id="format-select"
        className="format-dropdown"
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Select quality...
        </option>
        {videoFormats.length > 0 && (
          <optgroup label="Video">
            {videoFormats.map((f) => (
              <option key={f.format_id} value={f.format_id}>
                {formatLabel(f)}
              </option>
            ))}
          </optgroup>
        )}
        {audioFormats.length > 0 && (
          <optgroup label="Audio Only">
            {audioFormats.map((f) => (
              <option key={f.format_id} value={f.format_id}>
                {formatLabel(f)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
