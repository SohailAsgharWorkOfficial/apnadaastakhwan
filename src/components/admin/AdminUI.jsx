/**
 * Shared admin UI pieces so every admin screen feels like one product.
 */

/** Page title block with optional actions on the right. */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red-ink mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1.5 text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  brand: 'bg-brand-red-ink/10 text-brand-red-ink',
  green: 'bg-brand-green-ink/12 text-brand-green-ink',
  gold: 'bg-brand-mustard/20 text-brand-wood',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-gray-100 text-gray-600',
};

/** A KPI card — the workhorse of the admin overview. */
export function StatCard({ icon: Icon, label, value, sub, tone = 'brand', to }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 leading-none">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-2 text-pretty">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={`inline-flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${
              TONES[tone] || TONES.brand
            }`}
          >
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  const cls =
    'block rounded-2xl bg-brand-surface border border-gray-200/70 p-5 shadow-card transition duration-200 hover:shadow-card-lg';

  return to ? (
    <a href={to} className={`${cls} hover:border-brand-red-ink/30`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** A titled panel — the standard container for admin sections. */
export function Panel({ title, description, actions, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl bg-brand-surface border border-gray-200/70 shadow-card overflow-hidden ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-200/90">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display font-bold text-lg text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-0.5 text-pretty">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Empty state for admin lists. */
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="px-6 py-14 text-center">
      {Icon && (
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gray-100 text-gray-400 mb-4">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <p className="font-display font-bold text-gray-800">{title}</p>
      {message && <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Table shell with a sticky, uppercase header row. */
export function AdminTable({ head, children, minWidth = '640px' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="bg-brand-creamdark/50 border-b border-gray-200">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

/** Small pill for statuses. */
export function StatusPill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-gray-100 text-gray-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    brand: 'bg-brand-red-ink/10 text-brand-red-ink',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}
