import { useMemo, useState } from 'react';
import { MapPin, Check, Phone, Clock, X } from 'lucide-react';
import { DELIVERY_ZONES, zoneForArea, WHATSAPP_LINK } from '../utils/constants';

/**
 * "Do you deliver to my block?" — the single most-asked question for a
 * home-delivery kitchen. Answers instantly, with the real delivery window.
 */
export default function DeliveryAreaChecker({ className = '' }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = DELIVERY_ZONES.flatMap((z) =>
      z.blocks.map((b) => ({ block: b, zone: z }))
    );
    return all.filter(
      (m) =>
        m.block.toLowerCase().includes(q) || m.zone.name.toLowerCase().includes(q)
    );
  }, [query]);

  const zone = selected ? zoneForArea(selected) : null;

  return (
    <div className={className}>
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red-ink pointer-events-none"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="area-check">
          Search for your block
        </label>
        <input
          id="area-check"
          type="search"
          className="input pl-11 pr-10"
          placeholder="Type your block — e.g. Block 16"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected('');
          }}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelected('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
            aria-label="Clear search"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Results */}
      <div aria-live="polite" className="mt-4">
        {zone ? (
          <div className="rounded-2xl border-2 border-brand-green-ink/40 bg-brand-green-ink/10 p-5">
            <div className="flex items-center gap-2 text-brand-green-ink">
              <Check size={20} aria-hidden="true" />
              <p className="font-display font-bold text-gray-900">
                Yes — we deliver to {selected}
              </p>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
              <p className="flex items-center gap-2 text-gray-600">
                <Clock size={15} className="text-brand-green-ink shrink-0" aria-hidden="true" />
                {zone.eta}
              </p>
              <p className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="text-brand-green-ink shrink-0" aria-hidden="true" />
                {zone.name}
              </p>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4 !py-2 !px-4 text-sm"
            >
              <Phone size={15} aria-hidden="true" /> Start my subscription
            </a>
          </div>
        ) : query.trim() ? (
          matches.length ? (
            <ul className="space-y-2">
              {matches.map((m) => (
                <li key={m.block}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.block)}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-brand-surface px-4 py-3 hover:border-brand-red-ink/40 hover:bg-brand-red-ink/5 transition duration-200"
                  >
                    <span>
                      <span className="block font-semibold text-sm text-gray-800">
                        {m.block}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {m.zone.name} · {m.zone.eta}
                      </span>
                    </span>
                    <Check size={16} className="text-brand-green-ink shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/25 p-5">
              <p className="font-semibold text-gray-900">
                We don&rsquo;t have &ldquo;{query.trim()}&rdquo; on the list yet.
              </p>
              <p className="text-sm text-gray-600 mt-1.5">
                We add areas regularly — call us and we&rsquo;ll confirm coverage and
                timing for your address.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn-outline mt-4 !py-2 !px-4 text-sm"
              >
                <Phone size={15} aria-hidden="true" /> Ask on WhatsApp
              </a>
            </div>
          )
        ) : (
          <ul className="flex flex-wrap gap-2">
            {DELIVERY_ZONES.map((z) => (
              <li
                key={z.id}
                className="inline-flex items-center gap-1.5 bg-brand-creamdark/70 border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700"
              >
                <MapPin size={12} className="text-brand-red-ink" aria-hidden="true" />
                {z.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
