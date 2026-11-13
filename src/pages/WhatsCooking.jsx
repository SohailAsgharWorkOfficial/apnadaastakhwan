import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Moon,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import { useMenu, dishForDate } from '../hooks/useMenu';
import {
  todayStr,
  addDays,
  fmtDate,
  weekForDate,
  weekDateRange,
  WHATSAPP_LINK,
} from '../utils/constants';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';

/**
 * "What's cooking?" — pick any date and see exactly what is on the menu.
 *
 * The rotation follows the calendar month: Week 1 is the 1st–7th, Week 2 the
 * 8th–14th, Week 3 the 15th–21st and Week 4 the 22nd–28th. Everyone eats the
 * same dish on the same date, whatever day they joined.
 */
export default function WhatsCooking() {
  const [params, setParams] = useSearchParams();
  const { menu, loading, error, retry } = useMenu();

  const today = todayStr();
  const selected = params.get('date') || today;

  const dish = useMemo(() => dishForDate(menu, selected), [menu, selected]);

  // The calendar week this date falls in, e.g. "1 – 7 Nov 2026".
  const weekRange = useMemo(() => {
    const d = new Date(`${selected}T00:00:00`);
    return weekDateRange(weekForDate(selected), d.getFullYear(), d.getMonth() + 1);
  }, [selected]);

  // 14 days centred on the selected date, skipping Sundays.
  const days = useMemo(() => {
    const out = [];
    for (let i = -3; i <= 10; i += 1) {
      const d = addDays(selected, i);
      if (new Date(`${d}T00:00:00`).getDay() !== 0) out.push(d);
    }
    return out;
  }, [selected]);

  const setDate = (d) => setParams({ date: d }, { replace: true });

  const shift = (days) => setDate(addDays(selected, days));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Reveal>
        <SectionHeading
          eyebrow="Plan ahead"
          title="What's"
          highlight="Cooking?"
          description="Pick any date to see the dinner on the 4-week rotation. Skip or pause from your dashboard up to 10 PM the night before."
        />
      </Reveal>

      {/* Date navigator */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shift(-7)}
          className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-gray-200 bg-brand-surface text-gray-600 hover:bg-brand-red-ink/10 hover:text-brand-red-ink transition duration-200"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        <div className="text-center">
          <p className="font-display font-bold text-xl text-gray-900">{fmtDate(selected)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(`${selected}T00:00:00`).toLocaleDateString('en-US', {
              weekday: 'long',
            })}
            {selected === today && ' · Today'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => shift(7)}
          className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-gray-200 bg-brand-surface text-gray-600 hover:bg-brand-red-ink/10 hover:text-brand-red-ink transition duration-200"
          aria-label="Next week"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      {/* The dish */}
      <Reveal>
        <div className="mt-8 card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <UtensilsCrossed
                size={32}
                className="mx-auto text-brand-red-ink animate-bounce"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-500 mt-3">Loading the menu…</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center px-6">
              <p className="font-semibold text-gray-800">
                Could not load the menu right now.
              </p>
              <p className="text-sm text-gray-500 mt-1.5">{error.message}</p>
              <button type="button" onClick={retry} className="btn-outline mt-5">
                Try again
              </button>
            </div>
          ) : dish?.title ? (
            <div className="grid sm:grid-cols-[minmax(0,240px)_1fr]">
              {dish.imageUrl && (
                <div className="h-48 sm:h-full bg-brand-creamdark overflow-hidden">
                  <img
                    src={dish.imageUrl}
                    alt={dish.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="badge bg-brand-green-ink/10 text-brand-green-ink">
                    <UtensilsCrossed size={12} aria-hidden="true" /> Week {dish.week}
                  </span>
                  <span className="badge bg-gray-100 text-gray-700">
                    {weekRange}
                  </span>
                  <span className="badge bg-brand-red-ink/10 text-brand-red-ink">
                    <Sparkles size={12} aria-hidden="true" /> {dish.day}
                  </span>
                  {(dish.tags || []).map((t) => (
                    <span
                      key={t}
                      className="badge bg-brand-mustard/20 text-brand-wood"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                  {dish.title}
                </h2>
                {dish.description && (
                  <p className="text-gray-600 mt-2.5 text-pretty">{dish.description}</p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/plans" className="btn-primary !py-2.5 !px-5 text-sm">
                    Subscribe to this menu
                  </Link>
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline !py-2.5 !px-5 text-sm"
                  >
                    Ask about this dish
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-14 text-center px-6">
              <Moon size={30} className="mx-auto text-gray-400" aria-hidden="true" />
              <p className="font-display font-bold text-lg text-gray-800 mt-3">
                {dish?.day === 'Sunday'
                  ? 'Sunday off — our rest day'
                  : 'Not scheduled for this date'}
              </p>
              <p className="text-sm text-gray-500 mt-1.5">
                The kitchen is planning next week&rsquo;s rotation. Try another date, or
                message us and we&rsquo;ll tell you what&rsquo;s on.
              </p>
            </div>
          )}
        </div>
      </Reveal>

      {/* Date strip */}
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Pick a date
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
          {days.map((d) => {
            const item = dishForDate(menu, d);
            const isSelected = d === selected;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                aria-pressed={isSelected}
                className={`rounded-xl border p-3 text-left transition duration-200
                  ${
                    isSelected
                      ? 'border-brand-red-ink bg-brand-red-ink text-white shadow-card'
                      : 'border-gray-200 bg-brand-surface hover:border-brand-red-ink/40'
                  }`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    isSelected ? 'text-white/85' : 'text-gray-500'
                  }`}
                >
                  {new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    isSelected ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {fmtDate(d)}
                </p>
                <p
                  className={`text-xs font-semibold mt-1.5 line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {item?.title || 'Off / TBD'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-8 text-center">
        The menu rotates with the calendar month — Week 1 is the 1st to the 7th, and
        so on. Everyone eats the same dish on the same date, so the menu your
        neighbour is having is the menu you are having.
      </p>
    </div>
  );
}
