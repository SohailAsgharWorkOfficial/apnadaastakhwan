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

export const AREAS = [
  'Block 16 (near Noor Masjid)',
  'Block 13A',
  'Block 13B',
  'Block 13C',
  'Block 13D',
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
  'Other / Nearby Block',
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

// Which week (1-4) of the rotational menu does a given date fall in?
export const weekForDate = (startDate, dateStr) => {
  const idx = Math.floor(diffDays(startDate, dateStr) / 7);
  return ((idx % 4) + 4) % 4 + 1;
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
