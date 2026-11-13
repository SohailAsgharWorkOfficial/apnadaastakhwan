import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { Bike, Printer, Phone, Moon, AlertTriangle, Check } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { todayStr, todayName, fmtDate, TIME_SLOTS } from '../../utils/constants';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

export default function AdminDelivery() {
  const [subs, setSubs] = useState([]);
  const [mealFilter, setMealFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const today = todayStr();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc')),
      (snap) => {
        setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const deliversToday = (s) =>
    s.status === 'active' &&
    s.startDate <= today &&
    today <= s.endDate &&
    !(s.pausedDates || []).includes(today);

  const todayList = subs.filter(deliversToday);
  const areas = [...new Set(todayList.map((s) => s.area).filter(Boolean))];

  const filtered = todayList.filter(
    (s) =>
      (mealFilter === 'all' || s.mealTime === mealFilter) &&
      (areaFilter === 'all' || s.area === areaFilter)
  );

  const markDelivered = async (id) => {
    await updateDoc(doc(db, 'subscriptions', id), {
      status: 'delivered',
      updatedAt: new Date().toISOString(),
    });
    toast.success('Marked delivered');
  };

  const lunchCount = filtered.reduce((sum, s) => sum + (s.groupOrder?.packs || 1), 0);
  const dinnerCount = lunchCount;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Bike size={22} className="text-brand-red-ink" aria-hidden="true" /> Rider Delivery Sheet
          </h1>
          <p className="text-gray-500 text-sm flex items-center gap-1.5 flex-wrap">
            <span>
              {todayName()}, {fmtDate(today)} — {lunchCount} dinner stops
            </span>
            {todayName() === 'Sunday' ? (
              <span className="inline-flex items-center gap-1 text-orange-700">
                <AlertTriangle size={14} aria-hidden="true" /> Sunday off — check specials
              </span>
            ) : (
              <span>• 6-day dinner cycle (Mon–Sat)</span>
            )}
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Print Sheet
        </button>
      </div>

      <div className="flex gap-2 mb-5 no-print">
        {['all', 'lunch', 'dinner', 'both'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMealFilter(m)}
            aria-pressed={mealFilter === m}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
              focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
              ${
                mealFilter === m
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-surface border border-gray-200 text-gray-600 hover:bg-brand-red-ink/10'
              }`}
          >
            {m === 'all' ? 'All Meals' : m}
          </button>
        ))}
        <select
          className="input !w-auto !py-1.5 text-xs"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          aria-label="Filter by area"
        >
          <option value="all">All Areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="print-area">
          <div className="card !p-5">
            <h2 className="font-display font-bold text-lg mb-1 hidden print:block">
              ApnaDastarkhwan — Delivery Sheet — {todayName()}, {fmtDate(today)}
            </h2>
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No deliveries scheduled for today with these filters.
              </p>
            ) : (
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-brand-charcoal text-brand-ivory text-xs uppercase">
                  <tr>
                    <th scope="col" className="text-left px-3 py-2.5 rounded-tl-lg">#</th>
                    <th scope="col" className="text-left px-3 py-2.5">Customer</th>
                    <th scope="col" className="text-left px-3 py-2.5">Phone</th>
                    <th scope="col" className="text-left px-3 py-2.5">Address</th>
                    <th scope="col" className="text-left px-3 py-2.5">Slot</th>
                    <th scope="col" className="text-left px-3 py-2.5 rounded-tr-lg print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} className="border-b border-gray-200 align-top">
                      <td className="px-3 py-2.5 font-semibold text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-gray-800">{s.customerName}</p>
                        <span className="badge bg-brand-mustard/20 text-brand-wood capitalize !text-[10px]">
                          <Moon size={11} aria-hidden="true" /> {s.mealTime}
                          {s.groupOrder?.packs > 1 ? ` × ${s.groupOrder.packs}` : ''}
                        </span>
                        {s.selectedWeek && (
                          <span className="badge bg-brand-green-ink/10 text-brand-green-ink !text-[10px] ml-1">
                            W{s.selectedWeek}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex items-center gap-1 text-brand-red-ink print:no-underline"
                        >
                          <Phone size={12} aria-hidden="true" /> {s.phone}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 text-xs max-w-[220px] text-gray-700">
                        {s.address}
                        <span className="block text-gray-500">{s.area}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {TIME_SLOTS[s.mealTime] || TIME_SLOTS.dinner}
                      </td>
                      <td className="px-3 py-2.5 print:hidden">
                        <button
                          type="button"
                          onClick={() => markDelivered(s.id)}
                          className="btn-secondary !px-3 !py-1.5 text-xs"
                        >
                          <Check size={13} aria-hidden="true" /> Delivered
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
