import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  TIME_SLOTS,
  PAYMENT_METHODS,
  NAYAPAY_ACCOUNT,
  AREAS,
  COVERAGE,
  WEEKS,
  WHATSAPP_LINK,
  GROUP_ORDER_DEFAULTS,
  formatPKR,
  fmtDate,
  addDays,
  PLAN_SPAN,
} from '../utils/constants';
import toast from 'react-hot-toast';
import { Truck, CreditCard, Package, Users, MapPin } from 'lucide-react';

export default function Checkout() {
  const { user, profile } = useAuth();
  const { plan, addons, toggleAddon, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    area: AREAS[0],
    address: '',
    startDate: addDays(new Date().toISOString().slice(0, 10), 1),
    paymentMethod: 'cod',
    selectedWeek: 1,
    groupOrder: false,
    packs: 3,
  });
  const [proofFile, setProofFile] = useState(null);
  const [groupCfg, setGroupCfg] = useState(GROUP_ORDER_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name: f.name || profile.name || '',
        phone: f.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  // Admin-managed bulk discount config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'groupOrder'), (snap) => {
      if (snap.exists()) setGroupCfg({ ...GROUP_ORDER_DEFAULTS, ...snap.data() });
    });
    return unsub;
  }, []);

  const groupActive = form.groupOrder && groupCfg.enabled && form.packs >= groupCfg.minPacks;
  const packs = groupActive ? form.packs : 1;
  const baseTotal = (plan?.pricePKR || 0) * packs;
  const groupDiscount = groupActive ? Math.round((baseTotal * groupCfg.discountPercent) / 100) : 0;
  const addonsTotal = useMemo(() => addons.reduce((s, a) => s + (a.pricePKR || 0), 0), [addons]);
  const total = baseTotal - groupDiscount + addonsTotal;
  const totalMeals = (plan?.totalMeals || PLAN_SPAN[plan?.durationType] || 1) * packs;

  const isOnline = form.paymentMethod !== 'cod';
  const endDate = plan ? addDays(form.startDate, (PLAN_SPAN[plan.durationType] || 1) - 1) : form.startDate;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plan) {
      toast.error('Please select a plan first!');
      navigate('/plans');
      return;
    }
    if (!form.name || !form.phone || !form.area || !form.address) {
      toast.error('Please fill all delivery details');
      return;
    }
    if (new Date(`${form.startDate}T00:00:00`).getDay() === 0) {
      toast.error('Dinners run Monday–Saturday (Sunday off). Pick a Monday–Saturday start.');
      return;
    }
    if (isOnline && !proofFile) {
      toast.error('Please upload your NayaPay payment screenshot');
      return;
    }

    setSubmitting(true);
    try {
      let paymentProofUrl = '';
      if (proofFile) {
        const storage = getStorage();
        const path = `payments/${user.uid}/${Date.now()}_${proofFile.name}`;
        await uploadBytes(ref(storage, path), proofFile);
        paymentProofUrl = path;
      }

      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        customerName: form.name,
        phone: form.phone,
        address: form.address,
        area: form.area,
        planId: plan.id,
        planTitle: plan.title,
        durationType: plan.durationType,
        mealTime: 'dinner',
        selectedWeek: plan.durationType === 'weekly' ? Number(form.selectedWeek) : null,
        addons: addons.map((a) => ({ id: a.id, name: a.name, pricePKR: a.pricePKR })),
        groupOrder: {
          enabled: groupActive,
          packs,
          discountPercent: groupActive ? groupCfg.discountPercent : 0,
        },
        totalMeals,
        startDate: form.startDate,
        endDate,
        totalAmount: total,
        paymentMethod: form.paymentMethod,
        paymentProofUrl,
        paymentStatus: 'unpaid',
        status: 'pending',
        pausedDates: [],
        createdAt: serverTimestamp(),
      });

      toast.success('Subscription requested! Team will confirm shortly. 🍲');
      clearCart();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-brand-red mb-4" />
        <h1 className="text-2xl font-bold mb-2">No plan selected</h1>
        <p className="text-gray-500 mb-6">Choose a dinner package to continue with checkout.</p>
        <a href="/plans" className="btn-primary">Browse Plans</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">
        Checkout — <span className="text-brand-red">{plan.title}</span>
      </h1>
      <div className="flex items-center gap-2 text-sm text-brand-green bg-brand-green/10 rounded-xl px-4 py-2.5 mb-8 w-fit">
        <MapPin size={16} /> Delivery coverage: {COVERAGE.hub} — {COVERAGE.detail}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Truck size={20} className="text-brand-red" /> Delivery Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={set('name')} placeholder="Ali Khan" required />
              </div>
              <div>
                <label className="label">Phone Number (WhatsApp) *</label>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" required />
              </div>
              <div>
                <label className="label">Area / Block *</label>
                <select className="input" value={form.area} onChange={set('area')}>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Delivery Time Slot</label>
                <div className="input bg-brand-cream font-medium text-sm">🌙 Dinner — {TIME_SLOTS.dinner}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Complete Hostel / Flat Address *</label>
                <textarea
                  className="input h-20"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Flat 402, Rahat Apartments, near Noor Masjid, Block 16, Gulshan-e-Iqbal"
                  required
                />
              </div>
              <div>
                <label className="label">Start Date * <span className="text-xs text-gray-400">(Monday–Saturday)</span></label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={set('startDate')}
                  required
                />
              </div>
              {plan.durationType === 'weekly' && (
                <div>
                  <label className="label">Choose Menu Week *</label>
                  <select className="input" value={form.selectedWeek} onChange={set('selectedWeek')}>
                    {WEEKS.map((w) => (
                      <option key={w} value={w}>Week {w} Menu</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">End Date</label>
                <div className="input bg-brand-cream font-medium text-sm">{fmtDate(endDate)}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              6-Day Dinner Cycle: deliveries Monday to Saturday, Sunday off.
            </p>
          </div>

          {/* Group order */}
          <div className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={20} className="text-brand-red" /> Group / Hostel Order
            </h2>
            <label className="flex items-center gap-3 text-sm cursor-pointer mb-3">
              <input
                type="checkbox"
                className="w-4 h-4 accent-red-700"
                checked={form.groupOrder}
                disabled={!groupCfg.enabled}
                onChange={(e) => setForm({ ...form, groupOrder: e.target.checked })}
              />
              <span>
                This is a group order to the <b>same address</b>
                {!groupCfg.enabled && <span className="text-gray-400"> (currently unavailable)</span>}
              </span>
            </label>
            {form.groupOrder && groupCfg.enabled && (
              <div className="grid sm:grid-cols-2 gap-4 items-end bg-brand-cream rounded-xl p-4 border border-brand-creamdark">
                <div>
                  <label className="label">Number of Packs (min {groupCfg.minPacks})</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={form.packs}
                    onChange={(e) => setForm({ ...form, packs: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
                <div className="text-sm">
                  {groupActive ? (
                    <span className="badge bg-brand-green text-white !text-xs px-3 py-1.5">
                      🎉 {groupCfg.discountPercent}% bulk discount applied
                    </span>
                  ) : (
                    <p className="text-gray-500">
                      Add {groupCfg.minPacks - form.packs} more pack(s) to unlock{' '}
                      <b>{groupCfg.discountPercent}% discount</b>.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-brand-red" /> Payment Method
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-start gap-3 border-2 rounded-xl p-3.5 cursor-pointer transition ${
                    form.paymentMethod === pm.id
                      ? 'border-brand-red bg-brand-red/5'
                      : 'border-gray-200 hover:border-brand-red/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1 accent-red-700"
                    checked={form.paymentMethod === pm.id}
                    onChange={() => setForm({ ...form, paymentMethod: pm.id })}
                  />
                  <div>
                    <p className="font-semibold text-sm">{pm.label}</p>
                    <p className="text-xs text-gray-500">{pm.note}</p>
                  </div>
                </label>
              ))}
            </div>

            {isOnline && (
              <div className="mt-4 bg-brand-cream rounded-xl p-4 border border-brand-creamdark">
                <p className="text-sm font-semibold mb-1">NayaPay Payment Details</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Transfer <b>{formatPKR(total)}</b> to:
                  <br />
                  NayaPay ID: <b>{NAYAPAY_ACCOUNT.id}</b> ({NAYAPAY_ACCOUNT.name})
                </p>
                <label className="label mt-3">Upload Payment Screenshot *</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input !py-2"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  required
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Facing an issue?{' '}
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="text-brand-green font-semibold hover:underline">
                Confirm your order on WhatsApp instead →
              </a>
            </p>
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <div className="card sticky top-24">
            <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-right">{plan.title}</span>
              </div>
              {plan.durationType === 'weekly' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Menu Week</span>
                  <span className="font-semibold">Week {form.selectedWeek}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Dinners</span>
                <span className="font-semibold">{totalMeals} × (Mon–Sat)</span>
              </div>
              {packs > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Group Packs</span>
                  <span className="font-semibold">{packs} packs</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Start</span>
                <span className="font-semibold">{fmtDate(form.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">End</span>
                <span className="font-semibold">{fmtDate(endDate)}</span>
              </div>
              <hr className="border-brand-creamdark" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Add-ons</p>
              <div className="space-y-2">
                {addons.map((a) => (
                  <label key={a.id} className="flex items-center justify-between text-sm cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="accent-red-700" checked onChange={() => toggleAddon(a)} />
                      {a.name}
                    </span>
                    <span className="font-medium">+{formatPKR(a.pricePKR)}</span>
                  </label>
                ))}
              </div>
              <hr className="border-brand-creamdark" />
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Total</span>
                <span className="font-semibold">{formatPKR(baseTotal)}</span>
              </div>
              {groupActive && (
                <div className="flex justify-between text-brand-green font-semibold">
                  <span>Bulk Discount ({groupCfg.discountPercent}%)</span>
                  <span>−{formatPKR(groupDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-brand-red">{formatPKR(total)}</span>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-5" disabled={submitting}>
              {submitting ? 'Placing Order...' : 'Confirm Subscription'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Your subscription starts as <b>Pending</b> and activates after payment verification.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
