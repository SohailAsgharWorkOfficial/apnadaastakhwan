import { useMemo } from 'react';
import { useCollection } from './useFirestore';
import { MENU_EPOCH, weekForDate, todayStr, addDays } from '../utils/constants';

/**
 * The 4-week rotational menu, plus helpers to answer "what am I eating
 * on <date>?" — the question every subscriber asks.
 */
export function useMenu() {
  const { data, loading, error, retry } = useCollection('rotationalMenu');

  const menu = useMemo(() => {
    const map = {};
    data.forEach((d) => {
      map[d.week ?? parseInt(d.id.replace('week', ''))] = d;
    });
    return map;
  }, [data]);

  return { menu, loading, error, retry };
}

/**
 * The dish served on a given date.
 *
 * Public visitors see the dish from the calendar rotation (anchored to
 * MENU_EPOCH); a subscriber's week is offset by their own start date.
 */
export function dishForDate(menu, dateStr, startDate = MENU_EPOCH) {
  if (!menu || !dateStr) return null;

  const week = weekForDate(startDate, dateStr);
  const days = menu[week]?.days || {};
  const key = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const dish = days[key];
  if (!dish?.title || dish.available === false) {
    return { week, day: key, title: null, description: '', available: false };
  }
  return { week, day: key, ...dish, available: true };
}

/** The next `count` delivery dates, skipping Sundays. */
export function upcomingDates(count = 7, from = todayStr()) {
  const out = [];
  let d = from;
  while (out.length < count) {
    const dow = new Date(`${d}T00:00:00`).getDay();
    if (dow !== 0) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}
