import { useMemo } from 'react';
import { useCollection } from './useFirestore';
import { weekForDate, todayStr, addDays } from '../utils/constants';

/**
 * The 4-week rotational menu, plus helpers to answer "what am I eating
 * on <date>?" — the question every subscriber asks.
 */
export function useMenu() {
  const { data, loading, error, slow, retry } = useCollection('rotationalMenu');

  const menu = useMemo(() => {
    const map = {};
    data.forEach((d) => {
      map[d.week ?? parseInt(d.id.replace('week', ''))] = d;
    });
    return map;
  }, [data]);

  return { menu, loading, error, slow, retry };
}

/**
 * The dish served on a given date.
 *
 * The rotation follows the calendar month, so the answer is the same for
 * everyone: the 1st–7th is Week 1, the 8th–14th Week 2, and so on.
 */
export function dishForDate(menu, dateStr) {
  if (!menu || !dateStr) return null;

  const week = weekForDate(dateStr);
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
