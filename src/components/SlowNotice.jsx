import { Clock, RefreshCw } from 'lucide-react';

/**
 * Shown when a Firestore read has taken unusually long. Without this the
 * user just stares at a spinner with no idea whether anything is happening.
 */
export default function SlowNotice({ slow, onRetry, className = '' }) {
  if (!slow) return null;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/25 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 ${className}`}
    >
      <Clock size={16} className="shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-[12rem]">
        This is taking longer than usual — your connection may be slow.
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2 hover:no-underline"
        >
          <RefreshCw size={14} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}
