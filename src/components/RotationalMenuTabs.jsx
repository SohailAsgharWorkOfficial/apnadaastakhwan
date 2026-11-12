import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { db } from '../firebase/firebase';
import { DAYS, WEEKS, todayName, COVERAGE } from '../utils/constants';
import Loader from './Loader';

/**
 * Shared 4-Week Rotational Dinner Menu viewer.
 * variant: 'cards' (Menu page) | 'table' (Home page)
 */
export default function RotationalMenuTabs({ variant = 'cards' }) {
  const [menu, setMenu] = useState(null);
  const [week, setWeek] = useState(1);
  const today = todayName();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rotationalMenu'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.data().week ?? parseInt(d.id.replace('week', ''))] = { id: d.id, ...d.data() }));
      setMenu(map);
    });
    return unsub;
  }, []);

  if (!menu) return <Loader />;
  if (!menu[week]) {
    return (
      <p className="text-center text-gray-500 py-8">
        Menu for Week {week} coming soon. Bachte hain! 🍲
      </p>
    );
  }

  const days = menu[week].days || {};
  const hasDish = (d) => (days[d] || {}).title && days[d]?.available !== false;

  const weekBtn = (w) => (
    <button
      key={w}
      onClick={() => setWeek(w)}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
        week === w
          ? 'bg-brand-red text-white shadow-md'
          : 'bg-white text-brand-charcoal border border-gray-200 hover:bg-brand-red/10'
      }`}
    >
      Week {w}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-8">{WEEKS.map(weekBtn)}</div>

      {today !== 'Sunday' && hasDish(today) && (
        <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 bg-brand-green/10 border border-brand-green/30 rounded-2xl px-5 py-4">
          <UtensilsCrossed size={22} className="text-brand-green shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase text-brand-green">Tonight's Dinner — Week {week}</p>
            <p className="font-display font-bold">{days[today].title}</p>
            <p className="text-xs text-gray-500">{days[today].description}</p>
          </div>
        </div>
      )}

      {variant === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] bg-white rounded-2xl shadow-card overflow-hidden">
            <thead className="bg-brand-charcoal text-brand-cream text-sm">
              <tr>
                <th className="text-left px-5 py-3.5">Day</th>
                <th className="text-left px-5 py-3.5">🌙 Dinner (8:00 - 9:30 PM)</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr
                  key={day}
                  className={`border-t border-brand-creamdark ${
                    day === today ? 'bg-brand-red/5 font-semibold' : i % 2 ? 'bg-brand-cream/50' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    {day}
                    {day === today && <span className="badge bg-brand-red text-white ml-2">Tonight</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {hasDish(day) ? days[day].title : 'Not scheduled'}
                    {hasDish(day) && (
                      <span className="block text-xs text-gray-400 font-normal">{days[day].description}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-brand-creamdark bg-brand-creamdark/50">
                <td className="px-5 py-3 font-medium">Sunday</td>
                <td className="px-5 py-3 text-sm text-gray-500">Sunday Off / Special — order on WhatsApp 🍲</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => (
            <div
              key={day}
              className={`card !p-5 ${day === today ? 'ring-2 ring-brand-red' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="badge bg-brand-green/10 text-brand-green">{day}</span>
                {day === today && <span className="badge bg-brand-red text-white">Tonight</span>}
              </div>
              {hasDish(day) ? (
                <>
                  <h3 className="font-display font-bold">{days[day].title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{days[day].description}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Not scheduled</p>
              )}
            </div>
          ))}
          <div className="card !p-5 bg-brand-creamdark/60 border border-dashed border-brand-wood/40">
            <span className="badge bg-brand-wood/20 text-brand-wood mb-2">Sunday</span>
            <h3 className="font-display font-bold">Sunday Off / Special</h3>
            <p className="text-sm text-gray-500 mt-1">Special orders & meetha via WhatsApp — apna dastarkhwan rest day.</p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
        <MapPin size={13} /> Deliveries in {COVERAGE.hub} — {COVERAGE.detail}
      </p>
    </div>
  );
}
