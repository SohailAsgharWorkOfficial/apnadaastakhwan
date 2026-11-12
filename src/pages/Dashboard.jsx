import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  CalendarDays,
  PauseCircle,
  PlayCircle,
  Utensils,
  History,
  User,
  Trash2,
  BadgeCheck,
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
  STATUS_STYLES,
  TIME_SLOTS,
} from '../utils/constants';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, profile, updateUserProfile } = useAuth();
  const [subs, setSubs] = useState(null);
  const [tab, setTab] = useState('subscription');
  const [pauseDate, setPauseDate] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

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

  if (subs === null) return <Loader full />;

  const activeSub = subs.find((s) => ['active', 'paused', 'pending'].includes(s.status));
  const pastSubs = subs.filter((s) => !['active', 'paused', 'pending'].includes(s.status));

  const mealsLeft = activeSub ? remainingMeals(activeSub) : 0;
  const currentWeek = activeSub
    ? weekForDate(activeSub.startDate, todayStr() > activeSub.startDate ? todayStr() : activeSub.startDate)
    : null;

  const togglePause = async (pause) => {
    if (!activeSub) return;
    if (pause) {
      if (!pauseDate) {
        toast.error('Pick a date to pause');
        return;
      }
      if (!canPauseDate(pauseDate)) {
        toast.error('Cutoff: pausing allowed up to 10 PM the night before');
        return;
      }
      if (activeSub.pausedDates?.includes(pauseDate)) {
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
        toast.error('Could not pause. Try again.');
      }
    } else {
      try {
        await updateDoc(doc(db, 'subscriptions', activeSub.id), {
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
        toast.success('Subscription resumed! Khana wapis on the way 🍲');
      } catch {
        toast.error('Could not resume. Try again.');
      }
    }
  };

  const removePause = async (date) => {
    if (!canPauseDate(date)) {
      toast.error('Cutoff passed — this date can no longer be un-paused');
      return;
    }
    const pausedDates = activeSub.pausedDates.filter((d) => d !== date);
    const endDate = addDays(activeSub.endDate, -1);
    await updateDoc(doc(db, 'subscriptions', activeSub.id), {
      pausedDates,
      endDate,
      status: pausedDates.length ? 'paused' : 'active',
      updatedAt: new Date().toISOString(),
    });
    toast.success('Pause removed. End date adjusted.');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile(user.uid, profileForm);
  };

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
        tab === id ? 'bg-brand-red text-white shadow' : 'bg-white text-gray-600 hover:bg-brand-red/10'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Salam, <span className="text-brand-red">{profile?.name || 'Friend'}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your tiffin, pauses and orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabBtn('subscription', 'My Subscription', Utensils)}
          {tabBtn('orders', 'Order History', History)}
          {tabBtn('profile', 'Profile', User)}
        </div>
      </div>

      {/* SUBSCRIPTION TAB */}
      {tab === 'subscription' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeSub ? (
              <div className="card">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                  <div>
                    <span className={`badge ${STATUS_STYLES[activeSub.status]} uppercase`}>
                      {activeSub.status.replace('_', ' ')}
                    </span>
                    {activeSub.selectedWeek && (
                      <span className="badge bg-brand-green/10 text-brand-green">
                        Week {activeSub.selectedWeek} Menu
                      </span>
                    )}
                    <h2 className="font-display text-2xl font-bold mt-2">{activeSub.planTitle}</h2>
                    <p className="text-sm text-gray-500 capitalize">
                      🌙 Dinner Tiffin • 6-Day Cycle (Mon–Sat, Sunday off) • {activeSub.durationType} plan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Monthly/Total</p>
                    <p className="font-display text-2xl font-bold text-brand-red">
                      {formatPKR(activeSub.totalAmount)}
                    </p>
                    <p className={`badge mt-1 ${activeSub.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {activeSub.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-brand-cream rounded-xl p-4 text-center">
                    <CalendarDays size={20} className="mx-auto text-brand-green mb-1" />
                    <p className="font-display text-xl font-bold">
                      {activeSub ? Math.max(0, diffDays(todayStr(), activeSub.endDate) + 1) : 0}
                    </p>
                    <p className="text-xs text-gray-500">Days Left</p>
                  </div>
                  <div className="bg-brand-cream rounded-xl p-4 text-center">
                    <Utensils size={20} className="mx-auto text-brand-red mb-1" />
                    <p className="font-display text-xl font-bold">{mealsLeft}</p>
                    <p className="text-xs text-gray-500">Dinners Left</p>
                  </div>
                  <div className="bg-brand-cream rounded-xl p-4 text-center">
                    <BadgeCheck size={20} className="mx-auto text-brand-wood mb-1" />
                    <p className="font-display text-xl font-bold">{fmtDate(activeSub.endDate)}</p>
                    <p className="text-xs text-gray-500">Expiry</p>
                  </div>
                </div>
                {currentWeek && (
                  <p className="text-xs text-brand-green font-semibold mb-4">
                    This week's rotating menu: <b>Week {currentWeek}</b> • Tonight is{' '}
                    {todayName() === 'Sunday' ? 'Sunday (Off)' : `${todayName()} dinner`}
                  </p>
                )}

                <div className="border-t border-brand-creamdark pt-4">
                  <p className="text-sm font-semibold mb-2">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {activeSub.address}, {activeSub.area}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Slot: <b>🌙 Dinner — {TIME_SLOTS.dinner}</b> (Mon–Sat)
                  </p>
                </div>

                {/* PAUSE / SKIP */}
                <div className="border-t border-brand-creamdark mt-4 pt-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <PauseCircle size={16} className="text-brand-red" /> Skip / Pause Delivery
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Cutoff: pause any date up to <b>10:00 PM the night before</b>. Each paused day extends your end date.
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="date"
                      className="input max-w-[180px]"
                      value={pauseDate}
                      min={addDays(todayStr(), 1)}
                      onChange={(e) => setPauseDate(e.target.value)}
                    />
                    <button onClick={() => togglePause(true)} className="btn-outline !py-2 !px-4 text-sm">
                      <PauseCircle size={16} /> Pause This Date
                    </button>
                    {activeSub.status === 'paused' && (
                      <button onClick={() => togglePause(false)} className="btn-secondary !py-2 !px-4 text-sm">
                        <PlayCircle size={16} /> Resume Subscription
                      </button>
                    )}
                  </div>

                  {(activeSub.pausedDates?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {activeSub.pausedDates.map((d) => (
                        <span
                          key={d}
                          className="badge bg-orange-100 text-orange-700 flex items-center gap-1"
                        >
                          {fmtDate(d)}
                          {canPauseDate(d) && (
                            <button onClick={() => removePause(d)} title="Remove pause">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-14">
                <Utensils size={44} className="mx-auto text-brand-red/40 mb-3" />
                <h2 className="font-display text-xl font-bold mb-1">No active subscription</h2>
                <p className="text-gray-500 text-sm mb-5">
                  {subs.length
                    ? 'Your previous subscriptions have ended. Start a fresh one!'
                    : 'Ghar jaisa khana sirf ek click door hai.'}
                </p>
                <Link to="/plans" className="btn-primary">Browse Meal Plans</Link>
              </div>
            )}
          </div>

          {/* Payment notice card */}
          <div>
            {activeSub && activeSub.status === 'pending' && (
              <div className="card bg-yellow-50 border border-yellow-200">
                <h3 className="font-display font-bold mb-2">⏳ Pending Verification</h3>
                <p className="text-sm text-gray-600">
                  {activeSub.paymentMethod === 'cod'
                    ? 'Your COD order is awaiting confirmation by our team.'
                    : 'We are verifying your payment screenshot. You will be notified on WhatsApp.'}
                </p>
              </div>
            )}
            <div className="card bg-brand-green/5 border border-brand-green/20">
              <h3 className="font-display font-bold mb-2">🍲 Dastarkhwan Tip</h3>
              <p className="text-sm text-gray-600">
                Weekend par ghar ja rahe ho? Pause your Sat/Sun before Friday 10 PM — your
                subscription automatically extends. Zero paisa waste.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {subs.length === 0 && (
            <div className="card text-center py-10 text-gray-500">No orders yet.</div>
          )}
          {subs.map((s) => (
            <div key={s.id} className="card !p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold">{s.planTitle}</h3>
                  <span className={`badge ${STATUS_STYLES[s.status]}`}>{s.status.replace('_', ' ')}</span>
                  <span className={`badge ${s.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {fmtDate(s.startDate)} → {fmtDate(s.endDate)} • 🌙 Dinner
                  {s.selectedWeek ? ` • Week ${s.selectedWeek}` : ''} •{' '}
                  {s.paymentMethod.toUpperCase()}
                  {s.groupOrder?.packs > 1 ? ` • ${s.groupOrder.packs} packs` : ''}
                </p>
              </div>
              <p className="font-display font-bold text-brand-red">{formatPKR(s.totalAmount)}</p>
            </div>
          ))}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card max-w-xl space-y-4">
          <h2 className="font-display text-xl font-bold mb-2">Update Delivery Profile</h2>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone (WhatsApp)</label>
            <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} required />
          </div>
          <div>
            <label className="label">Area / Sector</label>
            <input className="input" value={profileForm.area} onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })} />
          </div>
          <div>
            <label className="label">Complete Address</label>
            <textarea className="input h-20" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-100" value={profile?.email || ''} disabled />
          </div>
          <button className="btn-primary">Save Changes</button>
        </form>
      )}
    </div>
  );
}
