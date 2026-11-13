import { Check, Clock, PauseCircle, Truck, PackageCheck } from 'lucide-react';
import { ORDER_FLOW, STATUS_LABELS } from '../utils/constants';

const ICONS = {
  pending: Clock,
  active: Check,
  out_for_delivery: Truck,
  delivered: PackageCheck,
};

const TONES = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-brand-green-ink/15 text-brand-green-ink',
  out_for_delivery: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
};

/**
 * Visual journey of a subscription — customers otherwise have no idea where
 * their order is.
 */
export default function OrderTimeline({ status = 'pending', className = '' }) {
  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className={`rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/25 p-4 ${className}`}>
        <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
          This subscription was cancelled.
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          Need to start again? Message us and we&rsquo;ll set up a fresh one.
        </p>
      </div>
    );
  }

  const currentIndex = ORDER_FLOW.findIndex((s) => s.id === status);
  const reached = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={className}>
      <ol className="relative">
        {ORDER_FLOW.map((step, i) => {
          const done = i <= reached;
          const current = i === reached;
          const Icon = ICONS[step.id] || Check;

          return (
            <li key={step.id} className="flex gap-4 pb-6 last:pb-0 relative">
              {/* Connector */}
              {i < ORDER_FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[17px] top-9 bottom-0 w-0.5 ${
                    i < reached ? 'bg-brand-green-ink/40' : 'bg-gray-200'
                  }`}
                />
              )}

              <span
                className={`relative z-10 inline-flex shrink-0 items-center justify-center h-9 w-9 rounded-full transition-colors duration-200
                  ${
                    done
                      ? `${TONES[step.id]} ${current ? 'ring-4 ring-brand-green-ink/15' : ''}`
                      : 'bg-gray-100 text-gray-400'
                  }`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>

              <div className="pt-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${
                    done ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${done ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {step.hint}
                </p>
                {current && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-green-ink mt-1.5">
                    Current status
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {isPaused && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/25 px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
          <PauseCircle size={16} aria-hidden="true" />
          Paused — resume any time and we&rsquo;ll extend your end date.
        </div>
      )}
    </div>
  );
}

export { STATUS_LABELS };
