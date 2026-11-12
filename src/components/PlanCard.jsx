import { useNavigate } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPKR } from '../utils/constants';
import toast from 'react-hot-toast';

export default function PlanCard({ plan }) {
  const navigate = useNavigate();
  const { selectPlan } = useCart();

  const durationLabel = {
    daily: 'Daily Tiffin',
    weekly: 'Weekly Trial',
    monthly: 'Monthly',
  }[plan.durationType];

  const perLabel = {
    daily: 'per day (1 dinner)',
    weekly: 'per week (6 dinners, Mon–Sat)',
    monthly: 'per month (24 dinners, Mon–Sat)',
  }[plan.durationType];

  const handleSelect = () => {
    if (!plan.isActive) return;
    selectPlan(plan);
    toast.success(`${plan.title} selected!`);
    navigate('/checkout');
  };

  return (
    <div
      className={`card relative flex flex-col hover:shadow-lg hover:-translate-y-1 transition duration-300 ${
        plan.isPopular ? 'ring-2 ring-brand-red' : ''
      } ${!plan.isActive ? 'opacity-60' : ''}`}
    >
      {plan.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-red text-white flex items-center gap-1">
          <Crown size={12} /> Most Popular
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="badge bg-brand-green/10 text-brand-green">{durationLabel}</span>
        <span className="badge bg-brand-mustard/20 text-brand-wood capitalize">🌙 Dinner</span>
      </div>
      <h3 className="font-display text-xl font-bold mb-2">{plan.title}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-display text-3xl font-extrabold text-brand-red">
          {formatPKR(plan.pricePKR)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">{perLabel}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {(plan.features || []).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={16} className="text-brand-green shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <button onClick={handleSelect} className="btn-primary w-full" disabled={!plan.isActive}>
        {plan.isActive ? 'Subscribe Now' : 'Unavailable'}
      </button>
    </div>
  );
}
