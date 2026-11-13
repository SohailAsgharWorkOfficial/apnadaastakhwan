import { UtensilsCrossed, Moon } from 'lucide-react';
import { resolveImageUrl } from '../utils/storage';

export default function MenuCard({ meal, dayName, mealType }) {
  if (!meal || !meal.title) return null;

  return (
    <article className="bg-brand-surface rounded-2xl shadow-card overflow-hidden flex flex-col group border border-gray-200/70">
      <div className="h-40 bg-brand-creamdark overflow-hidden">
        {meal.imageUrl && resolveImageUrl(meal.imageUrl) ? (
          <img
            src={resolveImageUrl(meal.imageUrl)}
            alt={meal.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-wood/50">
            <UtensilsCrossed size={40} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="badge bg-brand-green-ink/10 text-brand-green-ink">{dayName}</span>
          <span className="badge bg-brand-mustard/20 text-brand-wood">
            <Moon size={12} aria-hidden="true" /> {mealType}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold mt-1 text-gray-900">{meal.title}</h3>
        <p className="text-sm text-gray-500 mt-1 flex-1 text-pretty">{meal.description}</p>
      </div>
    </article>
  );
}
