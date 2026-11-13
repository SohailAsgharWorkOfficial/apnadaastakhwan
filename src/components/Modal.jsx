import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog: labelled by its heading, closes on Escape or backdrop
 * click, and moves focus into the panel when it opens.
 *
 * The focus trap is deliberately *not* re-created on every render — the
 * effect depends only on `open`. Re-running it would restore focus to the
 * trigger button on each keystroke and make typing inside the dialog
 * impossible.
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const restoreFocusRef = useRef(null);

  // Keep the latest callback without re-triggering the effect.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => onCloseRef.current?.(), []);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog (without stealing it back on re-render).
    // Move focus into the dialog (without stealing it back on re-render).
    const t = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      (focusable || panelRef.current)?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      clearTimeout(t);
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const headingId = `modal-title-${String(title || 'dialog')
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`bg-brand-surface rounded-2xl ${maxWidth} w-full p-6 max-h-[90vh] overflow-auto shadow-card-lg focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 id={headingId} className="font-display font-bold text-lg text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg shrink-0
              text-gray-500 hover:text-brand-red-ink hover:bg-brand-red-ink/10
              transition duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
