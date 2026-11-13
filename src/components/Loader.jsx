import { UtensilsCrossed } from 'lucide-react';

export default function Loader({ full = false, label = 'Loading…' }) {
  const cls = full
    ? 'min-h-[60vh] flex items-center justify-center'
    : 'flex items-center justify-center py-16';

  return (
    <div className={cls} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-brand-red-ink">
        <UtensilsCrossed className="animate-bounce" size={36} aria-hidden="true" />
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}
