export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKS = [1, 2, 3, 4];

export const WHATSAPP_NUMBER = '923303038457';
export const WHATSAPP_DISPLAY = '+92 330 3038457';
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Assalam o Alaikum! I want to order dinner tiffin from ApnaDastarkhwan. 🍲'
)}`;

export const BRAND_TAGLINE = 'Ghar ka Khaana, Sehat bhi!';
export const BRAND_SUBTAGLINE = 'We Make With Love — Homemade • Hygienic • Delicious';

export const COVERAGE = {
  hub: 'Gulshan-e-Iqbal, Karachi',
  detail: 'Block 16 (near Noor Masjid) & surrounding Gulshan blocks',
};

export const NAYAPAY_ACCOUNT = {
  label: 'NayaPay',
  id: '0330-3038457',
  name: 'ApnaDastarkhwan',
};

export const TIME_SLOTS = {
  dinner: '8:00 PM - 9:30 PM',
};

/**
 * Delivery coverage, grouped by zone so the public "do you deliver to me?"
 * checker can answer with a real window instead of a flat dropdown.
 */
export const DELIVERY_ZONES = [
  {
    id: 'core',
    name: 'Gulshan-e-Iqbal — Core',
    note: 'Noor Masjid & adjoining blocks',
    eta: '8:00 – 9:30 PM',
    blocks: [
      'Block 16 (near Noor Masjid)',
      'Block 13A',
      'Block 13B',
      'Block 13C',
      'Block 13D',
    ],
  },
  {
    id: 'extended',
    name: 'Gulshan-e-Iqbal — Extended',
    note: 'Wider ring, same kitchen',
    eta: '8:30 – 10:00 PM',
    blocks: [
      'Block 4',
      'Block 5',
      'Block 6',
      'Block 7',
      'Block 8',
      'Block 9',
      'Block 10',
      'Block 15',
      'Block 17',
      'Block 18',
    ],
  },
  {
    id: 'nearby',
    name: 'Nearby blocks',
    note: 'Ask us — we add areas regularly',
    eta: 'Confirm on WhatsApp',
    blocks: ['Other / Nearby Block'],
  },
];

export const AREAS = DELIVERY_ZONES.flatMap((z) => z.blocks);

/** Find the zone that covers a given block. */
export const zoneForArea = (area) =>
  DELIVERY_ZONES.find((z) => z.blocks.includes(area)) || null;

/**
 * The rotation follows the calendar month — see `weekForDate` below.
 * Week 1 = 1st–7th, Week 2 = 8th–14th, Week 3 = 15th–21st, Week 4 = 22nd–28th.
 */
export const ROTATION_WEEK_RANGES = [
  { week: 1, from: 1, to: 7 },
  { week: 2, from: 8, to: 14 },
  { week: 3, from: 15, to: 21 },
  { week: 4, from: 22, to: 28 },
];

/** Headline numbers for the hero — edit to match your real figures. */
export const HERO_STATS = [
  { value: 24, suffix: '', label: 'Dishes a month', sub: '4-week rotation' },
  { value: 6, suffix: '', label: 'Dinners a week', sub: 'Monday to Saturday' },
  { value: 8, suffix: ' PM', label: 'At your door', sub: '8:00 – 9:30 PM' },
  { value: 0, suffix: '', label: 'Preservatives', sub: 'Made with love' },
];

export const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery (COD)',
    note: 'Pay the rider at your doorstep',
  },
  {
    id: 'nayapay',
    label: 'NayaPay Transfer',
    note: `Transfer to ${NAYAPAY_ACCOUNT.id} (${NAYAPAY_ACCOUNT.name}) & upload screenshot`,
  },
];

export const SUBSCRIPTION_STATUS = [
  'pending',
  'active',
  'paused',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
];

/** The journey a subscription moves through — used by the status timeline. */
export const ORDER_FLOW = [
  { id: 'pending', label: 'Order received', hint: 'We have your request' },
  { id: 'active', label: 'Subscription active', hint: 'Your dinners are scheduled' },
  { id: 'out_for_delivery', label: 'Out for delivery', hint: 'On the way tonight' },
  { id: 'delivered', label: 'Delivered', hint: 'Enjoy your meal' },
];

export const STATUS_LABELS = {
  pending: 'Awaiting confirmation',
  active: 'Active',
  paused: 'Paused',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Build a WhatsApp link with a pre-filled, context-aware message. */
export const waLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** A WhatsApp order message pre-filled with the plan and details. */
export const waOrderMessage = ({ planTitle, area, startDate, packs } = {}) =>
  [
    'Assalam o Alaikum! I want to order dinner tiffin from ApnaDastarkhwan.',
    planTitle ? `Plan: ${planTitle}` : null,
    packs > 1 ? `Packs: ${packs}` : null,
    area ? `Area: ${area}` : null,
    startDate ? `Preferred start: ${startDate}` : null,
  ]
    .filter(Boolean)
    .join('\n');

export const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const ADDONS_FALLBACK = [
  { id: 'extra-chapati', name: 'Extra Chapati', pricePKR: 20 },
  { id: 'extra-raita', name: 'Extra Raita', pricePKR: 40 },
  { id: 'extra-salad', name: 'Extra Salad', pricePKR: 40 },
  { id: 'meetha', name: 'Sweet Dish (Meetha)', pricePKR: 80 },
];

// Group / Hostel bulk order defaults (overridable by admin in Firestore config/groupOrder)
export const GROUP_ORDER_DEFAULTS = {
  enabled: true,
  minPacks: 3,
  discountPercent: 10,
};

// Cutoff rule: pausing a meal is allowed up to 10:00 PM the night before.
export const PAUSE_CUTOFF_HOUR = 22;

export const formatPKR = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`;

export const toDateStr = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

export const todayStr = () => toDateStr(new Date());

export const todayName = () => {
  const d = new Date();
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
};

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

export const diffDays = (startStr, endStr) =>
  Math.round(
    (new Date(`${endStr}T00:00:00`) - new Date(`${startStr}T00:00:00`)) / 86400000
  );

export const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(`${toDateStr(dateStr)}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Can the customer pause/skip the given date? (before 10 PM the night before)
export const canPauseDate = (dateStr) => {
  const now = new Date();
  const target = new Date(`${dateStr}T00:00:00`);
  const cutoff = new Date(target);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(PAUSE_CUTOFF_HOUR, 0, 0, 0);
  return now < cutoff;
};

/**
 * Which week (1–4) of the rotational menu does a given date fall in?
 *
 * The rotation follows the **calendar month**: Week 1 is the 1st–7th, Week 2
 * the 8th–14th, Week 3 the 15th–21st and Week 4 the 22nd–28th. The 29th–31st
 * wrap back into Week 1. Everyone therefore eats the same dish on the same
 * calendar date, whatever day they subscribed.
 */
export const weekForDate = (dateStr) => {
  if (!dateStr) return 1;
  const day = new Date(`${dateStr}T00:00:00`).getDate();
  const week = Math.floor((day - 1) / 7) + 1;
  return week > 4 ? 1 : week;
};

/** The date range a calendar week covers, e.g. "1 – 7 May 2026". */
export const weekDateRange = (week, year, month) => {
  const first = new Date(year, month - 1, (week - 1) * 7 + 1);
  const last = new Date(year, month - 1, Math.min(week * 7, new Date(year, month, 0).getDate()));
  const fmt = (d) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(first)} – ${fmt(last)}`;
};

// Remaining dinner meals (Mon–Sat cycle, Sunday off, paused dates excluded)
export const remainingMeals = (sub) => {
  if (!sub?.startDate || !sub?.endDate) return 0;
  const today = todayStr();
  const from = today > sub.startDate ? today : sub.startDate;
  if (from > sub.endDate) return 0;
  let count = 0;
  let d = new Date(`${from}T00:00:00`);
  while (toDateStr(d) <= sub.endDate) {
    const ds = toDateStr(d);
    if (d.getDay() !== 0 && !(sub.pausedDates || []).includes(ds)) count++;
    d.setDate(d.getDate() + 1);
  }
  const totalMeals = sub.totalMeals ?? count;
  return Math.min(count, totalMeals);
};

// Duration helpers (plans span the 4-week Mon–Sat dinner cycle)
export const PLAN_SPAN = {
  daily: 1, // single dinner box
  weekly: 6, // 6 dinners, Mon–Sat
  monthly: 28, // 4 full weeks, Mon–Sat (24 meals)
};
