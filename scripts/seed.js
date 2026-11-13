import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'node:fs';

// Node 20.6+ can load .env natively; fall back to a tiny parser so the
// script still works on older runtimes and without the dotenv package.
function loadEnv() {
  try {
    process.loadEnvFile();
    return;
  } catch {
    /* not supported — parse manually below */
  }
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const value = match[2].replace(/^["']|["']$/g, '');
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    });
  } catch {
    console.warn('.env not found — relying on ambient environment variables.');
  }
}

loadEnv();

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(cfg);
const db = getFirestore(app);
const auth = getAuth(app);

const meal = (title, description) => ({ title, description, imageUrl: '', available: true });

// ===== PLANS (exact flyer pricing) =====
const PLANS = [
  {
    id: 'monthly-dinner',
    title: 'Monthly Dinner Package',
    durationType: 'monthly',
    mealTime: 'dinner',
    pricePKR: 12000,
    totalMeals: 24,
    cycleDays: 28,
    features: [
      '4-Week Complete Dinner Cycle (24 Meals)',
      'Monday to Saturday — Sunday Off',
      'Rotational 24-Dish Menu (Week 1-4)',
      'Skip / Pause Before 10 PM Cutoff',
      'COD & NayaPay Accepted',
    ],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'weekly-dinner-trial',
    title: 'Weekly Dinner Trial Package',
    durationType: 'weekly',
    mealTime: 'dinner',
    pricePKR: 3300,
    totalMeals: 6,
    cycleDays: 6,
    features: [
      '6 Dinner Meals — Monday to Saturday',
      'Choose Week 1, 2, 3 or 4',
      'Fresh from Rotational Menu',
      'Delivery in Gulshan-e-Iqbal',
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: 'daily-dinner',
    title: 'Daily Single Tiffin',
    durationType: 'daily',
    mealTime: 'dinner',
    pricePKR: 600,
    totalMeals: 1,
    cycleDays: 1,
    features: [
      "Today's Scheduled Dinner Box",
      'Same Dish as Rotational Menu',
      'Order Before 6 PM',
      'COD or NayaPay',
    ],
    isPopular: false,
    isActive: true,
  },
];

// ===== ADD-ONS =====
const ADDONS = [
  { id: 'extra-chapati', name: 'Extra Chapati', pricePKR: 20 },
  { id: 'extra-raita', name: 'Extra Raita', pricePKR: 40 },
  { id: 'extra-salad', name: 'Extra Salad', pricePKR: 40 },
  { id: 'meetha', name: 'Sweet Dish (Meetha)', pricePKR: 80 },
];

// ===== 4-WEEK ROTATIONAL DINNER MENU (exact flyer, 24 dishes) =====
// The rotation follows the CALENDAR MONTH:
//   Week 1 = 1st-7th   Week 2 = 8th-14th
//   Week 3 = 15th-21st Week 4 = 22nd-28th  (29th-31st wrap back to Week 1)
// Every customer eats the same dish on the same calendar date.
const ROTATIONAL_MENU = {
  week1: {
    week: 1,
    days: {
      Monday: meal('Chicken 2 Chapati + Daalani Salad', 'Chicken curry with 2 chapati & daalani salad'),
      Tuesday: meal('Kachri Pulao with Raita', 'Kachri pulao served with fresh raita'),
      Wednesday: meal('Channa Qeema', 'Channa qeema with 2 chapati & salad'),
      Thursday: meal('Vegetable', 'Mix vegetable sabzi with 2 chapati'),
      Friday: meal('Chicken Biryani with Raita', 'Chicken biryani served with raita'),
      Saturday: meal('Kebab Masala', 'Kebab masala with 2 chapati'),
    },
  },
  week2: {
    week: 2,
    days: {
      Monday: meal('Chicken Karahi', 'Chicken karahi with 2 chapati'),
      Tuesday: meal('Dal Chawal with Salad', 'Dal tadka with steamed rice & salad'),
      Wednesday: meal('Aloo Ke Qeema', 'Aloo ke qeema with 2 chapati & salad'),
      Thursday: meal('Anda Curry', 'Egg curry with 2 chapati'),
      Friday: meal('Chicken Yakhni Pulao', 'Aromatic chicken yakhni pulao'),
      Saturday: meal('Shami Kebab', 'Shami kebab with raita, salad & mint sauce'),
    },
  },
  week3: {
    week: 3,
    days: {
      Monday: meal('Chicken Qorma', 'Chicken qorma with 2 chapati & salad'),
      Tuesday: meal('Palak Dal with Roti', 'Palak dal with roti'),
      Wednesday: meal('Aloo Pulao', 'Aloo pulao with 2 chapati'),
      Thursday: meal('Chicken Kofte Curry', 'Chicken kofte curry with 2 chapati & salad'),
      Friday: meal('Chicken Jalfrezi', 'Chicken jalfrezi with Bukhari raita'),
      Saturday: meal('Anda Pulao', 'Anda pulao with 2 chapati & salad'),
    },
  },
  week4: {
    week: 4,
    days: {
      Monday: meal('Keema Karahi', 'Keema karahi with 2 chapati & salad'),
      Tuesday: meal('Dal Chana with Roti', 'Dal chana with roti'),
      Wednesday: meal('Beef Yakhni Pulao', 'Beef yakhni pulao with raita & salad'),
      Thursday: meal('Anda Masala', 'Anda masala with 2 chapati'),
      Friday: meal('Chana Pulao', 'Chana pulao with raita & salad'),
      Saturday: meal('Fried Rice + Chinese Chicken', 'Indo-Chinese special — fried rice with Chinese chicken'),
    },
  },
};

// ===== CONFIG =====
const GROUP_ORDER = { enabled: true, minPacks: 3, discountPercent: 10 };

/**
 * Firestore rules allow catalog writes for admins only, so sign in with an
 * admin account before writing. Credentials come from SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD (env or .env) — never hard-coded.
 */
async function authenticateAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      '\nNo SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD found.\n' +
        'Seeding will be attempted without signing in — that only works if\n' +
        'Firestore rules currently allow anonymous writes.\n'
    );
    return null;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Signed in as admin: ${cred.user.email}`);
    return cred.user;
  } catch (err) {
    console.error(`Admin sign-in failed: ${err.code || err.message}`);
    console.error(
      'Make sure this account exists and has role "admin" in users/{uid}.'
    );
    process.exit(1);
  }
}

async function seed() {
  console.log('Seeding plans, add-ons, 4-week rotational menu & config...');

  await authenticateAdmin();

  for (const plan of PLANS) {
    await setDoc(doc(db, 'plans', plan.id), plan);
    console.log(`  plan: ${plan.id} — Rs. ${plan.pricePKR}`);
  }

  await setDoc(doc(db, 'config', 'addons'), { items: ADDONS });
  console.log('  config/addons');

  await setDoc(doc(db, 'config', 'groupOrder'), GROUP_ORDER);
  console.log('  config/groupOrder');

  for (const [docId, data] of Object.entries(ROTATIONAL_MENU)) {
    await setDoc(doc(db, 'rotationalMenu', docId), data);
    console.log(`  rotationalMenu: ${docId} (6 dishes)`);
  }

  console.log('\nDone! Admin setup:');
  console.log('1. Register a normal account in the app');
  console.log('2. Firebase Console -> Firestore -> users/{uid}, set role: "admin"');
  console.log('3. Add SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to .env to re-seed later');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e.code || e.message);
  console.error('\nIf you got PERMISSION_DENIED: set SEED_ADMIN_EMAIL and');
  console.error('SEED_ADMIN_PASSWORD in .env for an account whose Firestore');
  console.error('users/{uid} doc has role: "admin", then run again.');
  process.exit(1);
});
