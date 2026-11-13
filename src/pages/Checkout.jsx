import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  Truck,
  CreditCard,
  Package,
  Users,
  MapPin,
  Moon,
  PartyPopper,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';import {
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
  todayStr,
  PLAN_SPAN,
} from '../utils/constants';
import FormErrorSummary from '../components/FormErrorSummary';
import { useDocument } from '../hooks/useFirestore';
import { uploadPrivateFile } from '../utils/storage';
import toast from 'react-hot-toast';

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

export default function Checkout() {
  const { user, profile } = useAuth();
  const { plan, addons, toggleAddon, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    area: AREAS[0],
    address: '',
    startDate: addDays(todayStr(), 1),
    paymentMethod: 'cod',
    selectedWeek: 1,
    groupOrder: false,
    packs: 3,
  });
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  // Admin-managed bulk discount config
  const { data: groupDoc } = useDocument('config/groupOrder');
  const groupCfg = useMemo(
    () => ({ ...GROUP_ORDER_DEFAULTS, ...(groupDoc || {}) }),
    [groupDoc]
  );

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name: f.name || profile.name || '',
        phone: f.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  const groupActive = form.groupOrder && groupCfg.enabled && form.packs >= groupCfg.minPacks;
  const packs = groupActive ? form.packs : 1;
  const baseTotal = (plan?.pricePKR || 0) * packs;
  const groupDiscount = groupActive
    ? Math.round((baseTotal * groupCfg.discountPercent) / 100)
    : 0;
  const addonsTotal = useMemo(
    () => addons.reduce((s, a) => s + (a.pricePKR || 0), 0),
    [addons]
  );
  const total = baseTotal - groupDiscount + addonsTotal;
  const totalMeals =
    (plan?.totalMeals || PLAN_SPAN[plan?.durationType] || 1) * packs;

  const isOnline = form.paymentMethod !== 'cod';
  const endDate = plan
    ? addDays(form.startDate, (PLAN_SPAN[plan.durationType] || 1) - 1)
    : form.startDate;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  /* ── Validation ─────────────────────────────────────────────── */
  const validate = () => {
    const next = [];

    if (!form.name.trim()) {
      next.push({ field: 'name', href: '#name', message: 'Enter the delivery name' });
    }
    if (!form.phone.trim()) {
      next.push({ field: 'phone', href: '#phone', message: 'Enter a contact number' });
    } else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      next.push({
        field: 'phone',
        href: '#phone',
        message: 'Enter a valid Pakistani phone number, e.g. 0300-1234567',
      });
    }
    if (!form.area) {
      next.push({ field: 'area', href: '#area', message: 'Select your area / block' });
    }
    if (!form.address.trim() || form.address.trim().length < 10) {
      next.push({
        field: 'address',
        href: '#address',
        message: 'Enter the complete flat / house address',
      });
    }
    if (!form.startDate) {
      next.push({ field: 'startDate', href: '#startDate', message: 'Choose a start date' });
    } else if (new Date(`${form.startDate}T00:00:00`).getDay() === 0) {
      next.push({
        field: 'startDate',
        href: '#startDate',
        message: 'Dinners run Monday–Saturday. Please pick a Monday–Saturday start.',
      });
    }
    if (isOnline && !proofFile) {
      next.push({
        field: 'proof',
        href: '#proof',
        message: 'Upload your NayaPay payment screenshot',
      });
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!plan) {
      toast.error('Please select a plan first!');
      navigate('/plans');
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      let paymentProofUrl = '';
      if (proofFile) {
        const { publicId } = await uploadPrivateFile(
          `payments/${user.uid}`,
          proofFile
        );
        // Stored as the public_id — a signed delivery URL is generated on
        // demand so the receipt is never publicly guessable.
        paymentProofUrl = publicId;
      }

      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        area: form.area,
        planId: plan.id,
        planTitle: plan.title,
        durationType: plan.durationType,
        mealTime: 'dinner',
        selectedWeek:
          plan.durationType === 'weekly' ? Number(form.selectedWeek) : null,
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

      toast.success('Subscription requested! The team will confirm shortly.');
      clearCart();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProofFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG).');
      e.target.value = '';
      setProofFile(null);
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error('Screenshot is too large. Please upload an image under 5 MB.');
      e.target.value = '';
      setProofFile(null);
      return;
    }
    setProofFile(file);
  };

  const hasFieldError = (name) => errors.some((err) => err.field === name);
  const fieldError = (name) => errors.find((err) => err.field === name)?.message;

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-brand-red-ink mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">No plan selected</h1>
        <p className="text-gray-500 mb-6">
          Choose a dinner package to continue with checkout.
        </p>
        <Link to="/plans" className="btn-primary">
          Browse Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-2 text-balance">
        Checkout — <span className="text-brand-red-ink">{plan.title}</span>
      </h1>
      <div className="flex items-center gap-2 text-sm text-brand-green-ink bg-brand-green-ink/10 rounded-xl px-4 py-2.5 mb-8 w-fit">
        <MapPin size={16} aria-hidden="true" /> Delivery coverage: {COVERAGE.hub} —{' '}
        {COVERAGE.detail}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8" noValidate>
        {/* ── Left: form ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <FormErrorSummary errors={errors} />

          <section className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Truck size={20} className="text-brand-red-ink" aria-hidden="true" /> Delivery
              Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="name">
                  Full Name <span className="text-brand-red-ink">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  className={`input ${hasFieldError('name') ? 'input-error' : ''}`}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Ali Khan"
                  aria-invalid={hasFieldError('name') || undefined}
                  aria-describedby={hasFieldError('name') ? 'name-error' : undefined}
                  required
                />
                {hasFieldError('name') && (
                  <p id="name-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('name')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="phone">
                  Phone Number (WhatsApp) <span className="text-brand-red-ink">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={`input ${hasFieldError('phone') ? 'input-error' : ''}`}
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="0300-1234567"
                  aria-invalid={hasFieldError('phone') || undefined}
                  aria-describedby={hasFieldError('phone') ? 'phone-error' : undefined}
                  required
                />
                {hasFieldError('phone') && (
                  <p id="phone-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('phone')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="area">
                  Area / Block <span className="text-brand-red-ink">*</span>
                </label>
                <select
                  id="area"
                  name="area"
                  className={`input ${hasFieldError('area') ? 'input-error' : ''}`}
                  value={form.area}
                  onChange={set('area')}
                  aria-invalid={hasFieldError('area') || undefined}
                  aria-describedby={hasFieldError('area') ? 'area-error' : undefined}
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {hasFieldError('area') && (
                  <p id="area-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('area')}
                  </p>
                )}
              </div>

              <div>
                <span className="label">Delivery Time Slot</span>
                <div className="input bg-brand-creamdark/50 font-medium text-sm flex items-center gap-2 text-gray-700">
                  <Moon size={15} className="text-brand-red-ink" aria-hidden="true" /> Dinner —{' '}
                  {TIME_SLOTS.dinner}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Complete Hostel / Flat Address <span className="text-brand-red-ink">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  className={`input h-20 ${hasFieldError('address') ? 'input-error' : ''}`}
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Flat 402, Rahat Apartments, near Noor Masjid, Block 16, Gulshan-e-Iqbal"
                  aria-invalid={hasFieldError('address') || undefined}
                  aria-describedby={hasFieldError('address') ? 'address-error' : undefined}
                  required
                />
                {hasFieldError('address') && (
                  <p id="address-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('address')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="startDate">
                  Start Date <span className="text-brand-red-ink">*</span>{' '}
                  <span className="text-xs font-normal text-gray-500">(Monday–Saturday)</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className={`input ${hasFieldError('startDate') ? 'input-error' : ''}`}
                  value={form.startDate}
                  min={addDays(todayStr(), 1)}
                  onChange={set('startDate')}
                  aria-invalid={hasFieldError('startDate') || undefined}
                  aria-describedby={
                    hasFieldError('startDate') ? 'startDate-error' : undefined
                  }
                  required
                />
                {hasFieldError('startDate') && (
                  <p id="startDate-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('startDate')}
                  </p>
                )}
              </div>

              {plan.durationType === 'weekly' && (
                <div>
                  <label className="label" htmlFor="selectedWeek">
                    Choose Menu Week <span className="text-brand-red-ink">*</span>
                  </label>
                  <select
                    id="selectedWeek"
                    name="selectedWeek"
                    className="input"
                    value={form.selectedWeek}
                    onChange={set('selectedWeek')}
                  >
                    {WEEKS.map((w) => (
                      <option key={w} value={w}>
                        Week {w} Menu
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <span className="label">End Date</span>
                <div className="input bg-brand-creamdark/50 font-medium text-sm text-gray-700">
                  {fmtDate(endDate)}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              6-Day Dinner Cycle: deliveries Monday to Saturday, Sunday off.
            </p>
          </section>

          {/* Group order */}
          <section className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Users size={20} className="text-brand-red-ink" aria-hidden="true" /> Group / Hostel
              Order
            </h2>

            <label className="flex items-start gap-3 text-sm cursor-pointer mb-3">
              <input
                type="checkbox"
                id="groupOrder"
                className="mt-0.5 h-4 w-4 accent-[#9E2A3A] shrink-0"
                checked={form.groupOrder}
                disabled={!groupCfg.enabled}
                onChange={(e) => setForm({ ...form, groupOrder: e.target.checked })}
              />
              <span>
                This is a group order to the <b>same address</b>
                {!groupCfg.enabled && (
                  <span className="text-gray-500"> (currently unavailable)</span>
                )}
              </span>
            </label>

            {form.groupOrder && groupCfg.enabled && (
              <div className="grid sm:grid-cols-2 gap-4 items-end bg-brand-creamdark/50 rounded-xl p-4 border border-gray-200">
                <div>
                  <label className="label" htmlFor="packs">
                    Number of Packs (min {groupCfg.minPacks})
                  </label>
                  <input
                    id="packs"
                    name="packs"
                    type="number"
                    className="input"
                    min={1}
                    max={99}
                    value={form.packs}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        packs: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </div>
                <div className="text-sm">
                  {groupActive ? (
                    <span className="badge bg-brand-green text-white">
                      <PartyPopper size={12} aria-hidden="true" />{' '}
                      {groupCfg.discountPercent}% bulk discount applied
                    </span>
                  ) : (
                    <p className="text-gray-500">
                      Add {Math.max(0, groupCfg.minPacks - form.packs)} more pack(s) to unlock{' '}
                      <b>{groupCfg.discountPercent}% discount</b>.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <CreditCard size={20} className="text-brand-red-ink" aria-hidden="true" /> Payment
              Method
            </h2>

            <fieldset className="grid sm:grid-cols-2 gap-3">
              <legend className="sr-only">Choose a payment method</legend>
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-start gap-3 border-2 rounded-xl p-3.5 cursor-pointer transition duration-200 ${
                    form.paymentMethod === pm.id
                      ? 'border-brand-red-ink bg-brand-red-ink/5'
                      : 'border-gray-200 hover:border-brand-red-ink/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    className="mt-1 h-4 w-4 accent-[#9E2A3A] shrink-0"
                    checked={form.paymentMethod === pm.id}
                    onChange={() => setForm({ ...form, paymentMethod: pm.id })}
                  />
                  <span>
                    <span className="block font-semibold text-sm text-gray-800">
                      {pm.label}
                    </span>
                    <span className="block text-xs text-gray-500">{pm.note}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {isOnline && (
              <div className="mt-4 bg-brand-creamdark/50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-semibold mb-1 flex items-center gap-2 text-gray-800">
                  <ShieldCheck size={16} className="text-brand-green-ink" aria-hidden="true" />
                  NayaPay Payment Details
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Transfer <b>{formatPKR(total)}</b> to:
                  <br />
                  NayaPay ID: <b>{NAYAPAY_ACCOUNT.id}</b> ({NAYAPAY_ACCOUNT.name})
                </p>

                <label className="label mt-3" htmlFor="proof">
                  Upload Payment Screenshot <span className="text-brand-red-ink">*</span>
                </label>
                <input
                  id="proof"
                  name="proof"
                  type="file"
                  accept="image/*"
                  className={`input !py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-red-ink/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-red-ink ${
                    hasFieldError('proof') ? 'input-error' : ''
                  }`}
                  onChange={handleProofChange}
                  aria-invalid={hasFieldError('proof') || undefined}
                  aria-describedby={hasFieldError('proof') ? 'proof-error' : undefined}
                  required
                />
                {hasFieldError('proof') && (
                  <p id="proof-error" className="hint text-red-600 dark:text-red-300">
                    {fieldError('proof')}
                  </p>
                )}
                {proofFile && (
                  <p className="hint flex items-center gap-1.5 text-brand-green-ink">
                    <Upload size={13} aria-hidden="true" /> {proofFile.name} ready to upload
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Facing an issue?{' '}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="text-brand-green-ink font-semibold hover:underline underline-offset-2"
              >
                Confirm your order on WhatsApp instead →
              </a>
            </p>
          </section>
        </div>

        {/* ── Right: summary ────────────────────────────────────── */}
        <div>
          <div className="card sticky top-24">
            <h2 className="font-display text-xl font-bold mb-4 text-gray-900">Order Summary</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-right text-gray-800">{plan.title}</span>
              </div>
              {plan.durationType === 'weekly' && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Menu Week</span>
                  <span className="font-semibold text-gray-800">Week {form.selectedWeek}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Dinners</span>
                <span className="font-semibold text-gray-800">{totalMeals} × (Mon–Sat)</span>
              </div>
              {packs > 1 && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Group Packs</span>
                  <span className="font-semibold text-gray-800">{packs} packs</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Start</span>
                <span className="font-semibold text-gray-800">{fmtDate(form.startDate)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">End</span>
                <span className="font-semibold text-gray-800">{fmtDate(endDate)}</span>
              </div>

              <hr className="border-gray-200" />

              <p className="text-xs font-semibold text-gray-500 uppercase">Add-ons</p>
              {addons.length === 0 ? (
                <p className="text-xs text-gray-500">No add-ons selected.</p>
              ) : (
                <div className="space-y-2">
                  {addons.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#9E2A3A]"
                          checked
                          onChange={() => toggleAddon(a)}
                        />
                        {a.name}
                      </span>
                      <span className="font-medium text-gray-800">
                        +{formatPKR(a.pricePKR)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <hr className="border-gray-200" />

              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Plan Total</span>
                <span className="font-semibold text-gray-800">{formatPKR(baseTotal)}</span>
              </div>
              {groupActive && (
                <div className="flex justify-between gap-2 text-brand-green-ink font-semibold">
                  <span>Bulk Discount ({groupCfg.discountPercent}%)</span>
                  <span>−{formatPKR(groupDiscount)}</span>
                </div>
              )}
              {addonsTotal > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Add-ons</span>
                  <span className="font-semibold text-gray-800">{formatPKR(addonsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between gap-2 text-lg font-bold pt-1">
                <span className="text-gray-900">Total</span>
                <span className="text-brand-red-ink">{formatPKR(total)}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-5" disabled={submitting}>
              {submitting ? 'Placing Order…' : 'Confirm Subscription'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Your subscription starts as <b>Pending</b> and activates after payment
              verification.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
