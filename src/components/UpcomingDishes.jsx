import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, UtensilsCrossed, Moon } from 'lucide-react';
import { useMenu, dishForDate, upcomingDates } from '../hooks/useMenu';
import { todayStr, fmtDate } from '../utils/constants';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

/**
 * "What's cooking this week?" — a horizontal strip of the next few dinners.
 * Far more useful than a static menu: it answers the only question a
 * subscriber actually has.
 */
export default function UpcomingDishes({ count = 7, className = '' }) {
  const { menu, loading } = useMenu();
  const today = todayStr();
  const dates = upcomingDates(count, today);

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <SectionHeading
          align="left"
          eyebrow="Next on the table"
          title="What's"
          highlight="Cooking"
          description="The next few dinners on the 4-week rotation — tap any date to plan ahead."
        />
        <Link
          to="/whats-cooking"
          className="btn-outline !py-2 !px-4 text-sm shrink-0"
        >
          <CalendarDays size={16} aria-hidden="true" /> Full calendar
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {dates.map((d) => (
            <div
              key={d}
              className="h-40 rounded-2xl bg-brand-creamdark/60 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {dates.map((d, i) => {
            const dish = dishForDate(menu, d);
            const isToday = d === today;
            return (
              <Reveal key={d} delay={i * 55}>
                <Link
                  to={`/whats-cooking?date=${d}`}
                  className={`group block h-full rounded-2xl border p-4 transition duration-200 hover:-translate-y-1 hover:shadow-card-lg
                    ${
                      isToday
                        ? 'border-brand-red-ink/40 bg-brand-red-ink/5'
                        : 'border-gray-200 bg-brand-surface hover:border-brand-red-ink/30'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wide ${
                        isToday ? 'text-brand-red-ink' : 'text-gray-500'
                      }`}
                    >
                      {isToday ? 'Today' : dish?.day?.slice(0, 3)}
                    </span>
                    {isToday && (
                      <span className="h-2 w-2 rounded-full bg-brand-red-ink animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-gray-500">{fmtDate(d)}</p>

                  <div className="mt-3 flex-1">
                    {dish?.title ? (
                      <>
                        <p className="font-display font-bold text-sm leading-snug text-gray-900 group-hover:text-brand-red-ink transition-colors">
                          {dish.title}
                        </p>
                        {dish.description && (
                          <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 flex items-center gap-1.5">
                        <Moon size={14} aria-hidden="true" /> Not scheduled
                      </p>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                    <UtensilsCrossed size={10} aria-hidden="true" /> Week {dish?.week}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
