import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Users, Utensils, Wallet, Banknote, TrendingUp, Clock } from 'lucide-react';
import { db } from '../../firebase/firebase';
import {
  formatPKR,
  todayStr,
  todayName,
  weekForDate,
} from '../../utils/constants';
import Loader from '../../components/Loader';

export default function AdminOverview() {
  const [subs, setSubs] = useState([]);
  const [menu, setMenu] = useState({});
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
    const unsubM = onSnapshot(collection(db, 'rotationalMenu'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.data().week ?? parseInt(d.id.replace('week', ''))] = d.data();
      });
      setMenu(map);
    });
    return () => {
      unsub();
      unsubM();
    };
  }, []);

  if (loading) return <Loader />;

  const deliversToday = (s) =>
    ['active', 'out_for_delivery'].includes(s.status) &&
    s.startDate <= today &&
    today <= s.endDate &&
    !(s.pausedDates || []).includes(today) &&
    new Date(`${today}T00:00:00`).getDay() !== 0; // Sunday off

  const active = subs.filter(
    (s) =>
      ['active', 'paused', 'out_for_delivery'].includes(s.status) &&
      s.startDate <= today &&
      today <= s.endDate
  );
  const byDuration = (t) => active.filter((s) => s.durationType === t).length;

  const deliveringToday = subs.filter(deliversToday);
  const groupBoxes = deliveringToday.reduce((sum, s) => sum + (s.groupOrder?.packs || 1), 0);
  const dinnerBoxes = groupBoxes;

  const week = weekForDate(
    deliveringToday[0]?.startDate || today,
    today
  );
  const tonightDish =
    menu[week]?.days?.[todayName()]?.title || '—';

  const revenue = subs
    .filter((s) => s.paymentStatus === 'paid' && s.status !== 'cancelled')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const pendingCOD = subs
    .filter((s) => s.paymentMethod === 'cod' && s.paymentStatus === 'unpaid' && s.status !== 'cancelled')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const pendingNayaPay = subs.filter(
    (s) => s.status === 'pending' && s.paymentMethod !== 'cod'
  ).length;

  const stats = [
    {
      icon: Users,
      label: 'Active Subscribers',
      value: active.length,
      sub: `Monthly ${byDuration('monthly')} • Weekly ${byDuration('weekly')} • Daily ${byDuration('daily')}`,
      color: 'text-brand-green-ink bg-brand-green-ink/10',
    },
    {
      icon: Utensils,
      label: `Tonight's Kitchen Prep (${todayName()})`,
      value: `${dinnerBoxes} boxes`,
      sub: `${tonightDish} • Week ${week} • paused excluded • Sun off`,
      color: 'text-brand-red-ink bg-brand-red-ink/10',
    },
    {
      icon: Wallet,
      label: 'Total Revenue',
      value: formatPKR(revenue),
      sub: 'Verified & paid subscriptions',
      color: 'text-brand-wood bg-brand-mustard/20',
    },
    {
      icon: Banknote,
      label: 'Pending COD Collection',
      value: formatPKR(pendingCOD),
      sub: `${pendingNayaPay} NayaPay payment(s) awaiting verification`,
      color: 'text-orange-700 bg-orange-100',
    },
  ];

  const recent = subs.slice(0, 6);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Kitchen Overview</h1>
      <p className="text-gray-500 text-sm mb-6 flex items-center gap-1.5">
        <Clock size={14} /> Live snapshot for {todayName()}, {today}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card !p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="font-display text-2xl font-extrabold mt-0.5 text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 text-gray-900">
            <TrendingUp size={18} className="text-brand-green-ink" aria-hidden="true" /> Recent
            Subscriptions
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-gray-500 text-xs uppercase">
                <tr>
                  <th scope="col" className="pb-2">Customer</th>
                  <th scope="col" className="pb-2">Plan</th>
                  <th scope="col" className="pb-2">Amount</th>
                  <th scope="col" className="pb-2">Payment</th>
                  <th scope="col" className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-gray-200">
                    <td className="py-2.5 font-medium text-gray-800">{s.customerName}</td>
                    <td className="py-2.5 text-gray-600">{s.planTitle}</td>
                    <td className="py-2.5 font-semibold text-brand-red-ink">
                      {formatPKR(s.totalAmount)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`badge ${
                          s.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 capitalize text-gray-600">{s.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
