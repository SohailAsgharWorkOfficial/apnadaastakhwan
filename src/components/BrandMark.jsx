/**
 * ApnaDastarkhwan brand mark — the food-stall illustration from the official
 * logo (public/mark.png). The PNG has a transparent background, so it sits
 * correctly on both the light and dark surfaces.
 */
export default function BrandMark({
  size = 40,
  className = '',
  title = 'ApnaDastarkhwan',
  eager = false,
}) {
  return (
    <img
      src="/mark.png"
      alt={title}
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`object-contain select-none ${className}`}
      draggable="false"
    />
  );
}
