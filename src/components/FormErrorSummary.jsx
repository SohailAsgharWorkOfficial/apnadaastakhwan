import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Focusable error summary (WCAG-friendly).
 * Rendered above the form, receives focus after a failed submit, and links
 * each message to the field it refers to. Inline field errors are kept.
 */
export default function FormErrorSummary({ errors = [], title = 'There is a problem' }) {
  const ref = useRef(null);
  const hasErrors = errors.length > 0;

  useEffect(() => {
    if (hasErrors && ref.current) {
      ref.current.focus();
    }
  }, [hasErrors]);

  if (!hasErrors) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="form-error-summary-title"
      className="rounded-xl border-2 border-red-500/60 bg-red-50 dark:bg-red-950/30 p-4 mb-5"
    >
      <h2
        id="form-error-summary-title"
        className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 text-sm"
      >
        <AlertCircle size={18} aria-hidden="true" />
        {title}
      </h2>
      <ul className="mt-2 space-y-1 pl-7 list-disc text-sm text-red-800 dark:text-red-200">
        {errors.map((err) => (
          <li key={err.field}>
            {err.href ? (
              <a href={err.href} className="underline underline-offset-2 hover:no-underline">
                {err.message}
              </a>
            ) : (
              err.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
