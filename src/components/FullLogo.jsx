/**
 * The complete official logo lockup (illustration + brush-script wordmark),
 * shipped as public/logo.png with a transparent background.
 * Use for large placements — hero, auth pages, printable sheets.
 */
export default function FullLogo({
  width = 320,
  className = '',
  alt = 'ApnaDastarkhwan — Ghar ka Khaana, Sehat bhi',
  eager = false,
}) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={width}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`object-contain select-none ${className}`}
      draggable="false"
    />
  );
}
