import { useMemo, useState } from 'react';
import { MapPin, UtensilsCrossed, Moon, Coffee } from 'lucide-react';
import { DAYS, WEEKS, todayName, COVERAGE } from '../utils/constants';
import { resolveImageUrl } from '../utils/storage';
import Loader from './Loader';
import ErrorState from './ErrorState';
import SlowNotice from './SlowNotice';
import { useCollection } from '../hooks/useFirestore';

/**
 * Shared 4-Week Rotational Dinner Menu viewer.
 * variant: 'cards' (Menu page) | 'table' (Home page)
 */
export default function RotationalMenuTabs({ variant = 'cards' }) {
  const { data: docs, loading, error, slow, retry } = useCollection('rotationalMenu');
  const [week, setWeek] = useState(1);
  const today = todayName();

  const menu = useMemo(() => {
    const map = {};
    docs.forEach((d) => {
      map[d.week ?? parseInt(d.id.replace('week', ''))] = d;
    });
    return map;
  }, [docs]);

  if (loading) {
    return (
      <div>
        <Loader label="Loading this week’s menu…" />
        <SlowNotice slow={slow} onRetry={retry} className="max-w-xl mx-auto mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Menu could not be loaded"
        message="We could not reach the kitchen right now. Please try again in a moment."
        onRetry={retry}
      />
    );
  }

  const availableWeeks = WEEKS.filter((w) => menu[w]);
  const hasDish = (days, d) => (days[d] || {}).title && days[d]?.available !== false;

  if (!availableWeeks.length) {
    return (
      <p className="text-center text-gray-500 py-8">
        Menu is being updated — check back shortly!
      </p>
    );
  }

  // Keep the selection valid if the admin removes a week.
  const activeWeek = menu[week] ? week : availableWeeks[0];
  const days = menu[activeWeek]?.days || {};

  // The banner always reflects the week the visitor is currently browsing,
  // so switching tabs shows that week's dish for the current day.
  const todayDish = today === 'Sunday' ? null : days[today];
  const showTodayDish = Boolean(todayDish?.title && todayDish?.available !== false);

  const weekBtn = (w) => {
    const selected = activeWeek === w;
    return (
      <button
        key={w}
        type="button"
        onClick={() => setWeek(w)}
        aria-pressed={selected}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
          focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
          ${
            selected
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-brand-surface text-gray-700 border border-gray-200 hover:bg-brand-red-ink/10 hover:border-brand-red-ink/40'
          }`}
      >
        Week {w}
      </button>
    );
  };

  return (
    <div>
      <div
        className="flex flex-wrap gap-2 justify-center mb-8"
        role="group"
        aria-label="Choose a week from the rotating menu"
      >
        {availableWeeks.map(weekBtn)}
      </div>

      {showTodayDish && (
        <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 bg-brand-green-ink/10 border border-brand-green-ink/30 rounded-2xl px-5 py-4">
          <UtensilsCrossed size={22} className="text-brand-green-ink shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-green-ink">
              {today}&rsquo;s Dinner — Week {activeWeek}
            </p>
            <p className="font-display font-bold text-gray-900">{todayDish.title}</p>
            {todayDish.description && (
              <p className="text-xs text-gray-500">{todayDish.description}</p>
            )}
          </div>
        </div>
      )}

      {variant === 'table' ? (
        <div className="overflow-x-auto rounded-2xl shadow-card">
          <table className="w-full min-w-[560px] bg-brand-surface overflow-hidden">
            <caption className="sr-only">
              Dinner menu for week {activeWeek}, Monday to Saturday
            </caption>
            <thead className="bg-brand-charcoal text-brand-ivory text-sm">
              <tr>
                <th scope="col" className="text-left px-5 py-3.5 font-semibold">
                  Day
                </th>
                <th scope="col" className="text-left px-5 py-3.5 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Moon size={14} aria-hidden="true" /> Dinner (8:00 – 9:30 PM)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr
                  key={day}
                  className={`border-t border-gray-200 ${
                    day === today ? 'bg-brand-red-ink/5 font-semibold' : i % 2 ? 'bg-brand-creamdark/40' : ''
                  }`}
                >
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-gray-800">
                    {day}
                    {day === today && (
                      <span className="badge bg-brand-red text-white ml-2">Tonight</span>
                    )}
                  </th>
                  <td className="px-5 py-3.5 text-sm text-gray-700">
                    {hasDish(days, day) ? (
                      <>
                        {days[day].title}
                        {days[day].description && (
                          <span className="block text-xs text-gray-500 font-normal">
                            {days[day].description}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">Not scheduled</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-brand-creamdark/60">
                <th scope="row" className="px-5 py-3 text-left font-medium text-gray-800">
                  Sunday
                </th>
                <td className="px-5 py-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Coffee size={14} aria-hidden="true" /> Sunday off / special — order on
                    WhatsApp
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => (
            <div
              key={day}
              className={`card !p-0 overflow-hidden flex flex-col ${
                day === today ? 'ring-2 ring-brand-red-ink' : ''
              }`}
            >
              {hasDish(days, day) && days[day].imageUrl && resolveImageUrl(days[day].imageUrl) && (
                <div className="h-36 bg-brand-creamdark overflow-hidden">
                  <img
                    src={resolveImageUrl(days[day].imageUrl)}
                    alt={days[day].title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="!p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="badge bg-brand-green-ink/10 text-brand-green-ink">{day}</span>
                  {day === today && (
                    <span className="badge bg-brand-red text-white">Tonight</span>
                  )}
                </div>
                {hasDish(days, day) ? (
                  <>
                    <h3 className="font-display font-bold text-gray-900">{days[day].title}</h3>
                    <p className="text-sm text-gray-500 mt-1 text-pretty">
                      {days[day].description}
                    </p>
                    {(days[day].tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {days[day].tags.map((t) => (
                          <span
                            key={t}
                            className="badge bg-brand-mustard/20 text-brand-wood"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Not scheduled</p>
                )}
              </div>
            </div>
          ))}
          <div className="card !p-5 bg-brand-creamdark/60 border-dashed">
            <span className="badge bg-brand-wood/20 text-brand-wood mb-2">Sunday</span>
            <h3 className="font-display font-bold text-gray-900">Sunday Off / Special</h3>
            <p className="text-sm text-gray-500 mt-1">
              Special orders &amp; meetha via WhatsApp — apna dastarkhwan rest day.
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1.5">
        <MapPin size={13} aria-hidden="true" /> Deliveries in {COVERAGE.hub} — {COVERAGE.detail}
      </p>
    </div>
  );
}
