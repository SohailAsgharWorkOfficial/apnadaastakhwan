import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Could not load this right now',
  message = 'Check your connection and try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`card text-center py-12 px-6 border-red-300/60 dark:border-red-800 ${className}`}
    >
      <AlertTriangle
        size={36}
        className="mx-auto text-brand-red-ink mb-3"
        aria-hidden="true"
      />
      <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto text-pretty">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-5">
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}
