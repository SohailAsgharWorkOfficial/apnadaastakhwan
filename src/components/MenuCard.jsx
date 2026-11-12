import { UtensilsCrossed } from 'lucide-react';

export default function MenuCard({ meal, dayName, mealType }) {
  if (!meal || !meal.title) return null;
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col group">
      <div className="h-40 bg-brand-creamdark overflow-hidden">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-wood/40">
            <UtensilsCrossed size={40} />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className="badge bg-brand-green/10 text-brand-green">{dayName}</span>
          <span className="badge bg-brand-mustard/20 text-brand-wood capitalize">{mealType}</span>
        </div>
        <h3 className="font-display text-lg font-bold mt-1">{meal.title}</h3>
        <p className="text-sm text-gray-500 mt-1 flex-1">{meal.description}</p>
      </div>
    </div>
  );
}
