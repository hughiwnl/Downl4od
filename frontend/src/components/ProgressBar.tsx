/** Animated progress bar that fills from 0-100%. Color changes based on status
 *  (blue=downloading, yellow=processing, green=completed, red=failed). */

interface Props {
  progress: number;  // 0-100
  status: string;    // CSS class for color: downloading | processing | completed | failed
}

export function ProgressBar({ progress, status }: Props) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${status}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="progress-text">{progress.toFixed(1)}%</span>
    </div>
  );
}
