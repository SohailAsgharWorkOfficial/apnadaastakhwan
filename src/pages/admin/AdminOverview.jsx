import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Users, Utensils, Wallet, IndianRupee, TrendingUp, Clock } from 'lucide-react';
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
      color: 'text-brand-green bg-brand-green/10',
    },
    {
      icon: Utensils,
      label: `Tonight's Kitchen Prep (${todayName()})`,
      value: `${dinnerBoxes} boxes`,
      sub: `${tonightDish} • Week ${week} • paused excluded • Sun off`,
      color: 'text-brand-red bg-brand-red/10',
    },
    {
      icon: Wallet,
      label: 'Total Revenue',
      value: formatPKR(revenue),
      sub: 'Verified & paid subscriptions',
      color: 'text-brand-wood bg-brand-mustard/20',
    },
    {
      icon: IndianRupee,
      label: 'Pending COD Collection',
      value: formatPKR(pendingCOD),
      sub: `${pendingNayaPay} NayaPay payment(s) awaiting verification`,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const recent = subs.slice(0, 6);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Kitchen Overview</h1>
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
            <p className="font-display text-2xl font-extrabold mt-0.5">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-green" /> Recent Subscriptions
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-gray-400 text-xs uppercase">
                <tr>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Payment</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-brand-creamdark">
                    <td className="py-2.5 font-medium">{s.customerName}</td>
                    <td className="py-2.5">{s.planTitle}</td>
                    <td className="py-2.5 font-semibold text-brand-red">{formatPKR(s.totalAmount)}</td>
                    <td className="py-2.5">
                      <span className={`badge ${s.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 capitalize">{s.status.replace('_', ' ')}</td>
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
