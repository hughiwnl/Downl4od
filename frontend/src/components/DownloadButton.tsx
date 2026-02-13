/** Big "Download" button that starts the download. Disabled until a format is selected. */

interface Props {
  onClick: () => void;
  disabled: boolean;  // true when no format is selected
  loading: boolean;   // true while the download request is being sent
}

export function DownloadButton({ onClick, disabled, loading }: Props) {
  return (
    <button
      className="btn-primary btn-download"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Starting..." : "Download"}
    </button>
  );
}
