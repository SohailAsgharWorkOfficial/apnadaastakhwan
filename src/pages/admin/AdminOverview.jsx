import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  Users,
  UtensilsCrossed,
  Wallet,
  Banknote,
  Flame,
  Bike,
  CalendarDays,
  MessageSquareQuote,
  ClipboardList,
  ArrowRight,
  Inbox,
  PackageCheck,
  Moon,
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { formatPKR, todayStr, todayName, weekForDate } from '../../utils/constants';
import Loader from '../../components/Loader';
import {
  PageHeader,
  StatCard,
  Panel,
  AdminTable,
  StatusPill,
  EmptyState,
} from '../../components/admin/AdminUI';

export default function AdminOverview() {
  const [subs, setSubs] = useState(null);
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

  if (loading) return <Loader label="Loading the kitchen…" />;

  const deliversToday = (s) =>
    ['active', 'out_for_delivery'].includes(s.status) &&
    s.startDate <= today &&
    today <= s.endDate &&
    !(s.pausedDates || []).includes(today) &&
    new Date(`${today}T00:00:00`).getDay() !== 0;

  const active = subs.filter(
    (s) =>
      ['active', 'paused', 'out_for_delivery'].includes(s.status) &&
      s.startDate <= today &&
      today <= s.endDate
  );
  const byDuration = (t) => active.filter((s) => s.durationType === t).length;

  const deliveringToday = subs.filter(deliversToday);
  const groupBoxes = deliveringToday.reduce((sum, s) => sum + (s.groupOrder?.packs || 1), 0);

  const week = weekForDate(today);
  const tonightDish = menu[week]?.days?.[todayName()]?.title || 'Not scheduled';

  const revenue = subs
    .filter((s) => s.paymentStatus === 'paid' && s.status !== 'cancelled')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const pendingCOD = subs
    .filter((s) => s.paymentMethod === 'cod' && s.paymentStatus === 'unpaid' && s.status !== 'cancelled')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const pendingNayaPay = subs.filter(
    (s) => s.status === 'pending' && s.paymentMethod !== 'cod'
  ).length;

  const pendingApproval = subs.filter((s) => s.status === 'pending').length;
  const recent = subs.slice(0, 6);

  const isSunday = todayName() === 'Sunday';

  return (
    <div>
      <PageHeader
        eyebrow="Today at the kitchen"
        title="Kitchen Overview"
        description={`${todayName()}, ${today} · ${
          isSunday ? 'Sunday off — the kitchen is resting' : 'dinner service tonight'
        }`}
        actions={
          <>
            <Link to="/admin/menu" className="btn-outline !py-2 !px-3.5 text-sm">
              <UtensilsCrossed size={16} aria-hidden="true" /> Edit menu
            </Link>
            <Link to="/admin/delivery" className="btn-primary !py-2 !px-3.5 text-sm">
              <Bike size={16} aria-hidden="true" /> Delivery sheet
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          tone="green"
          label="Active subscribers"
          value={active.length}
          sub={`Monthly ${byDuration('monthly')} · Weekly ${byDuration('weekly')} · Daily ${byDuration('daily')}`}
        />
        <StatCard
          icon={PackageCheck}
          tone="brand"
          label="Boxes to cook tonight"
          value={groupBoxes}
          sub={`${deliveringToday.length} drop(s) · paused excluded · Sun off`}
        />
        <StatCard
          icon={Wallet}
          tone="gold"
          label="Verified revenue"
          value={formatPKR(revenue)}
          sub="Paid subscriptions only"
        />
        <StatCard
          icon={Banknote}
          tone="blue"
          label="COD still to collect"
          value={formatPKR(pendingCOD)}
          sub={`${pendingNayaPay} NayaPay payment(s) awaiting verification`}
        />
      </div>

      {/* Tonight + quick actions */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel
          title="Tonight's menu"
          description={`Week ${week} · ${todayName()}`}
          className="lg:col-span-1"
          actions={
            <Link
              to="/admin/menu"
              className="text-xs font-semibold text-brand-red-ink hover:underline inline-flex items-center gap-1"
            >
              Edit <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-brand-red-ink/10 text-brand-red-ink shrink-0">
                <Flame size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold text-lg text-gray-900 leading-snug">
                  {tonightDish}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <Moon size={13} aria-hidden="true" /> Dinner · 8:00 – 9:30 PM
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-200">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                  Deliveries today
                </dt>
                <dd className="font-display text-xl font-bold text-gray-900 mt-0.5">
                  {deliveringToday.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                  Awaiting approval
                </dt>
                <dd className="font-display text-xl font-bold text-gray-900 mt-0.5">
                  {pendingApproval}
                </dd>
              </div>
            </dl>
          </div>
        </Panel>

        <Panel title="Quick actions" className="lg:col-span-2">
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            {[
              {
                to: '/admin/delivery',
                icon: Bike,
                title: 'Print delivery sheet',
                desc: "Today's rider list, filterable by area",
              },
              {
                to: '/admin/orders',
                icon: ClipboardList,
                title: 'Verify payments',
                desc: `${pendingApproval} order(s) waiting on you`,
              },
              {
                to: '/admin/menu',
                icon: CalendarDays,
                title: 'Update this week',
                desc: 'Dish names, descriptions and photos',
              },
              {
                to: '/admin/testimonials',
                icon: MessageSquareQuote,
                title: 'Add a review',
                desc: 'Publish what customers said',
              },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-brand-red-ink/40 hover:bg-brand-red-ink/[0.03] transition duration-200"
              >
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-creamdark/70 text-brand-red-ink shrink-0 group-hover:bg-brand-red-ink/10 transition">
                  <a.icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-sm text-gray-900">
                    {a.title}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">{a.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent subscriptions */}
      <Panel
        title="Recent subscriptions"
        description="The latest orders, newest first"
        className="mt-4"
        actions={
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-brand-red-ink hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight size={13} aria-hidden="true" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No orders yet"
            message="Once a customer subscribes, their order will appear here in real time."
          />
        ) : (
          <AdminTable head={['Customer', 'Plan', 'Amount', 'Payment', 'Status']}>
            {recent.map((s) => (
              <tr key={s.id} className="hover:bg-brand-creamdark/40 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-red-ink/10 text-brand-red-ink text-xs font-bold shrink-0">
                      {(s.customerName || '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900 truncate">
                        {s.customerName}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">{s.area}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{s.planTitle}</td>
                <td className="px-5 py-3.5 font-semibold text-brand-red-ink whitespace-nowrap">
                  {formatPKR(s.totalAmount)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={s.paymentStatus === 'paid' ? 'green' : 'amber'}
                  >
                    {s.paymentStatus}
                  </StatusPill>
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={
                      s.status === 'active'
                        ? 'green'
                        : s.status === 'pending'
                          ? 'amber'
                          : s.status === 'cancelled'
                            ? 'red'
                            : 'slate'
                    }
                  >
                    {s.status.replace('_', ' ')}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </Panel>
    </div>
  );
}
