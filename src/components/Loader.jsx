import { UtensilsCrossed } from 'lucide-react';

export default function Loader({ full = false }) {
  const cls = full
    ? 'min-h-[60vh] flex items-center justify-center'
    : 'flex items-center justify-center py-16';
  return (
    <div className={cls}>
      <div className="flex flex-col items-center gap-3 text-brand-red">
        <UtensilsCrossed className="animate-bounce" size={36} />
        <p className="text-sm font-medium text-brand-charcoal/60">Loading...</p>
      </div>
    </div>
  );
}
