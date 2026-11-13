import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import {
  CalendarDays,
  PauseCircle,
  PlayCircle,
  Utensils,
  History,
  User,
  Trash2,
  BadgeCheck,
  Moon,
  Clock,
  Lightbulb,
  Phone,
} from 'lucide-react';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import {
  formatPKR,
  fmtDate,
  todayStr,
  todayName,
  diffDays,
  remainingMeals,
  weekForDate,
  canPauseDate,
  addDays,
  toDateStr,
  STATUS_STYLES,
  TIME_SLOTS,
} from '../utils/constants';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import SectionHeading from '../components/SectionHeading';
import { useCollection } from '../hooks/useFirestore';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'subscription', label: 'My Subscription', icon: Utensils },
  { id: 'orders', label: 'Order History', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Dashboard() {
  const { user, profile, updateUserProfile } = useAuth();
  const {
    data: subs,
    loading,
    error,
    retry,
  } = useCollection('subscriptions', {
    whereField: 'userId',
    whereValue: user?.uid,
    orderField: 'createdAt',
    orderDir: 'desc',
    enabled: Boolean(user?.uid),
  });
  const [tab, setTab] = useState('subscription');
  const [pauseDate, setPauseDate] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        area: profile.area || '',
      });
    }
  }, [profile]);

  const activeSub = useMemo(
    () => subs.find((s) => ['active', 'paused', 'pending'].includes(s.status)),
    [subs]
  );

  /** Next delivery dates in the cycle — Sundays excluded, paused days removed. */
  const upcomingMeals = useMemo(() => {
    if (!activeSub?.startDate || !activeSub?.endDate) return [];
    const paused = activeSub.pausedDates || [];
    const from = todayStr() > activeSub.startDate ? todayStr() : activeSub.startDate;
    const out = [];
    let d = new Date(`${from}T00:00:00`);
    let guard = 0;
    while (toDateStr(d) <= activeSub.endDate && guard < 60) {
      const ds = toDateStr(d);
      if (d.getDay() !== 0) {
        out.push({ date: ds, paused: paused.includes(ds) });
      }
      d.setDate(d.getDate() + 1);
      guard += 1;
    }
    return out.slice(0, 14);
  }, [activeSub]);

  if (loading) return <Loader full label="Loading your dashboard…" />;

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorState
          title="Dashboard could not be loaded"
          message="We could not reach the server right now. Please try again in a moment."
          onRetry={retry}
        />
      </div>
    );
  }

  const pastSubs = subs.filter((s) => !['active', 'paused', 'pending'].includes(s.status));

  const mealsLeft = activeSub ? remainingMeals(activeSub) : 0;
  const currentWeek = activeSub
    ? weekForDate(
        activeSub.startDate,
        todayStr() > activeSub.startDate ? todayStr() : activeSub.startDate
      )
    : null;

  const togglePause = async (pause) => {
    if (!activeSub) return;

    if (pause) {
      if (!pauseDate) {
        toast.error('Pick a date to pause');
        return;
      }
      if (new Date(`${pauseDate}T00:00:00`).getDay() === 0) {
        toast.error('Sunday is already off — no dinner is delivered that day.');
        return;
      }
      if (!canPauseDate(pauseDate)) {
        toast.error('Cut-off passed — pausing is allowed up to 10 PM the night before.');
        return;
      }
      if ((activeSub.pausedDates || []).includes(pauseDate)) {
        toast.error('This date is already paused');
        return;
      }

      const pausedDates = [...(activeSub.pausedDates || []), pauseDate];
      const endDate = addDays(activeSub.endDate, 1); // extend subscription by paused day
      try {
        await updateDoc(doc(db, 'subscriptions', activeSub.id), {
          pausedDates,
          endDate,
          status: 'paused',
          updatedAt: new Date().toISOString(),
        });
        toast.success(`Delivery paused on ${fmtDate(pauseDate)}. Subscription extended!`);
        setPauseDate('');
      } catch {
        toast.error('Could not pause. Please try again.');
      }
    } else {
      try {
        await updateDoc(doc(db, 'subscriptions', activeSub.id), {
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
        toast.success('Subscription resumed! Khana wapis on the way');
      } catch {
        toast.error('Could not resume. Please try again.');
      }
    }
  };

  const removePause = async (date) => {
    if (!activeSub) return;
    if (!canPauseDate(date)) {
      toast.error('Cut-off passed — this date can no longer be un-paused');
      return;
    }
    const pausedDates = (activeSub.pausedDates || []).filter((d) => d !== date);
    const endDate = addDays(activeSub.endDate, -1);
    try {
      await updateDoc(doc(db, 'subscriptions', activeSub.id), {
        pausedDates,
        endDate,
        status: pausedDates.length ? 'paused' : 'active',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Pause removed. End date adjusted.');
    } catch {
      toast.error('Could not remove the pause. Please try again.');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile(user.uid, profileForm);
  };

  const tabBtn = ({ id, label, icon: Icon }) => {
    const selected = tab === id;
    return (
      <button
        type="button"
        role="tab"
        id={`tab-${id}`}
        aria-selected={selected}
        aria-controls={`panel-${id}`}
        onClick={() => setTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
          focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
          ${
            selected
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-brand-surface text-gray-600 border border-gray-200 hover:bg-brand-red-ink/10'
          }`}
      >
        <Icon size={16} aria-hidden="true" /> {label}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">
            Salam, <span className="text-brand-red-ink">{profile?.name || 'Friend'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your tiffin, pauses and orders</p>
        </div>

        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Dashboard sections">
          {TABS.map(tabBtn)}
        </div>
      </div>

      {/* ── Subscription tab ─────────────────────────────────────── */}
      {tab === 'subscription' && (
        <div
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
          className="grid lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            {activeSub ? (
              <div className="card">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${STATUS_STYLES[activeSub.status]} uppercase`}>
                        {activeSub.status.replace('_', ' ')}
                      </span>
                      {activeSub.selectedWeek && (
                        <span className="badge bg-brand-green-ink/10 text-brand-green-ink">
                          Week {activeSub.selectedWeek} Menu
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold mt-2 text-gray-900">
                      {activeSub.planTitle}
                    </h2>
                    <p className="text-sm text-gray-500 capitalize flex items-center gap-1.5">
                      <Moon size={14} aria-hidden="true" /> Dinner Tiffin • 6-Day Cycle
                      (Mon–Sat, Sunday off) • {activeSub.durationType} plan
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-display text-2xl font-bold text-brand-red-ink">
                      {formatPKR(activeSub.totalAmount)}
                    </p>
                    <p
                      className={`badge mt-1 ${
                        activeSub.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {activeSub.paymentStatus}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-brand-creamdark/50 rounded-xl p-4 text-center">
                    <CalendarDays
                      size={20}
                      className="mx-auto text-brand-green-ink mb-1"
                      aria-hidden="true"
                    />
                    <dd className="font-display text-xl font-bold text-gray-900">
                      {Math.max(0, diffDays(todayStr(), activeSub.endDate) + 1)}
                    </dd>
                    <dt className="text-xs text-gray-500">Days Left</dt>
                  </div>
                  <div className="bg-brand-creamdark/50 rounded-xl p-4 text-center">
                    <Utensils size={20} className="mx-auto text-brand-red-ink mb-1" aria-hidden="true" />
                    <dd className="font-display text-xl font-bold text-gray-900">{mealsLeft}</dd>
                    <dt className="text-xs text-gray-500">Dinners Left</dt>
                  </div>
                  <div className="bg-brand-creamdark/50 rounded-xl p-4 text-center">
                    <BadgeCheck size={20} className="mx-auto text-brand-wood mb-1" aria-hidden="true" />
                    <dd className="font-display text-sm font-bold text-gray-900 pt-1.5">
                      {fmtDate(activeSub.endDate)}
                    </dd>
                    <dt className="text-xs text-gray-500">Expiry</dt>
                  </div>
                </dl>

                {currentWeek && (
                  <p className="text-xs text-brand-green-ink font-semibold mb-4">
                    This week&rsquo;s rotating menu: <b>Week {currentWeek}</b> • Today is{' '}
                    {todayName() === 'Sunday' ? 'Sunday (Off)' : `${todayName()} dinner`}
                  </p>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Delivery Address</h3>
                  <p className="text-sm text-gray-600 text-pretty">
                    {activeSub.address}, {activeSub.area}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                    <Clock size={14} aria-hidden="true" /> Slot:{' '}
                    <b>
                      Dinner — {TIME_SLOTS.dinner}
                    </b>{' '}
                    (Mon–Sat)
                  </p>
                </div>

                {/* Pause / skip */}
                <div className="border-t border-gray-200 mt-5 pt-5">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <PauseCircle size={16} className="text-brand-red-ink" aria-hidden="true" /> Skip /
                    Pause Delivery
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Cut-off: pause any date up to <b>10:00 PM the night before</b>. Each paused
                    day extends your end date.
                  </p>

                  <div className="flex gap-2 items-center flex-wrap">
                    <div>
                      <label className="sr-only" htmlFor="pauseDate">
                        Date to pause
                      </label>
                      <input
                        id="pauseDate"
                        type="date"
                        className="input max-w-[180px]"
                        value={pauseDate}
                        min={addDays(todayStr(), 1)}
                        onChange={(e) => setPauseDate(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePause(true)}
                      className="btn-outline !py-2 !px-4 text-sm"
                    >
                      <PauseCircle size={16} aria-hidden="true" /> Pause This Date
                    </button>
                    {activeSub.status === 'paused' && (
                      <button
                        type="button"
                        onClick={() => togglePause(false)}
                        className="btn-secondary !py-2 !px-4 text-sm"
                      >
                        <PlayCircle size={16} aria-hidden="true" /> Resume Subscription
                      </button>
                    )}
                  </div>

                  {/* Upcoming deliveries */}
                  {upcomingMeals.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Upcoming deliveries
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {upcomingMeals.map((m) => (
                          <li key={m.date}>
                            <span
                              className={`badge ${
                                m.paused
                                  ? 'bg-orange-100 text-orange-800 line-through'
                                  : 'bg-brand-green-ink/10 text-brand-green-ink'
                              }`}
                            >
                              {fmtDate(m.date)}
                              {m.paused && ' · paused'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(activeSub.pausedDates?.length || 0) > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Paused dates
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeSub.pausedDates.map((d) => (
                          <span
                            key={d}
                            className="badge bg-orange-100 text-orange-800 items-center gap-1.5 pr-1"
                          >
                            {fmtDate(d)}
                            {canPauseDate(d) && (
                              <button
                                type="button"
                                onClick={() => removePause(d)}
                                className="inline-flex items-center justify-center h-6 w-6 rounded-full
                                  hover:bg-orange-200 transition duration-200
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                aria-label={`Remove pause on ${fmtDate(d)}`}
                              >
                                <Trash2 size={12} aria-hidden="true" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-14">
                <Utensils size={44} className="mx-auto text-brand-red-ink/50 mb-3" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold mb-1 text-gray-900">
                  No active subscription
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {subs.length
                    ? 'Your previous subscriptions have ended. Start a fresh one!'
                    : 'Ghar jaisa khana sirf ek click door hai.'}
                </p>
                <Link to="/plans" className="btn-primary">
                  Browse Meal Plans
                </Link>
              </div>
            )}
          </div>

          {/* Side cards */}
          <div className="space-y-4">
            {activeSub?.status === 'pending' && (
              <div className="card bg-yellow-50 dark:bg-yellow-950/25 border-yellow-300 dark:border-yellow-700">
                <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-gray-900">
                  <Clock size={18} className="text-yellow-600" aria-hidden="true" /> Pending
                  Verification
                </h3>
                <p className="text-sm text-gray-600">
                  {activeSub.paymentMethod === 'cod'
                    ? 'Your COD order is awaiting confirmation by our team.'
                    : 'We are verifying your payment screenshot. You will be notified on WhatsApp.'}
                </p>
              </div>
            )}

            <div className="card bg-brand-green-ink/5 border-brand-green-ink/20">
              <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-gray-900">
                <Lightbulb size={18} className="text-brand-green-ink" aria-hidden="true" /> Dastarkhwan
                Tip
              </h3>
              <p className="text-sm text-gray-600 text-pretty">
                Weekend par ghar ja rahe ho? Pause your Sat/Sun before Friday 10 PM — your
                subscription automatically extends. Zero paisa waste.
              </p>
            </div>

            <div className="card">
              <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-gray-900">
                <Phone size={18} className="text-brand-red-ink" aria-hidden="true" /> Need help?
              </h3>
              <p className="text-sm text-gray-600">
                Message the team on WhatsApp — we usually reply within a few minutes.
              </p>
              <Link to="/menu" className="btn-ghost !px-0 mt-2 text-sm">
                View this week&rsquo;s menu →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Orders tab ───────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders" className="space-y-4">
          {subs.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <p className="mb-4">No orders yet.</p>
              <Link to="/plans" className="btn-primary">
                Browse Meal Plans
              </Link>
            </div>
          ) : (
            subs.map((s) => (
              <div
                key={s.id}
                className="card !p-5 flex items-center justify-between flex-wrap gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-gray-900">{s.planTitle}</h3>
                    <span className={`badge ${STATUS_STYLES[s.status]}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`badge ${
                        s.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Moon size={12} aria-hidden="true" /> Dinner
                    </span>
                    {s.selectedWeek ? ` • Week ${s.selectedWeek}` : ''} •{' '}
                    {s.paymentMethod.toUpperCase()}
                    {s.groupOrder?.packs > 1 ? ` • ${s.groupOrder.packs} packs` : ''}
                  </p>
                </div>
                <p className="font-display font-bold text-brand-red-ink">
                  {formatPKR(s.totalAmount)}
                </p>
              </div>
            ))
          )}

          {pastSubs.length === 0 && subs.length > 0 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              Past {pastSubs.length} completed subscriptions are kept here for your records.
            </p>
          )}
        </div>
      )}

      {/* ── Profile tab ──────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div
          role="tabpanel"
          id="panel-profile"
          aria-labelledby="tab-profile"
        >
          <form onSubmit={saveProfile} className="card max-w-xl space-y-4">
            <SectionHeading
              as="h2"
              align="left"
              title="Update Delivery"
              highlight="Profile"
              description="Saved details are pre-filled at checkout."
            />

            <div>
              <label className="label" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                className="input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="profile-phone">
                Phone (WhatsApp)
              </label>
              <input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                className="input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="profile-area">
                Area / Sector
              </label>
              <input
                id="profile-area"
                className="input"
                value={profileForm.area}
                onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor="profile-address">
                Complete Address
              </label>
              <textarea
                id="profile-address"
                className="input h-20"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                autoComplete="street-address"
              />
            </div>

            <div>
              <label className="label" htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                className="input bg-gray-100 text-gray-500"
                value={profile?.email || ''}
                disabled
                readOnly
              />
              <p className="hint">Email cannot be changed here.</p>
            </div>

            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
