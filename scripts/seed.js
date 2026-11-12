import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

let cfg = {};
try {
  dotenv.config();
  cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
} catch {
  cfg = {};
}

cfg = {
  apiKey: cfg.apiKey || 'YOUR_API_KEY',
  authDomain: cfg.authDomain || 'YOUR_AUTH_DOMAIN',
  projectId: cfg.projectId || 'YOUR_PROJECT_ID',
  storageBucket: cfg.storageBucket || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: cfg.messagingSenderId || 'YOUR_SENDER_ID',
  appId: cfg.appId || 'YOUR_APP_ID',
};

const app = initializeApp(cfg);
const db = getFirestore(app);

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
const ROTATIONAL_MENU = {
  week1: {
    week: 1,
    days: {
      Monday: meal('Chicken Curry + Daal Fry', 'Chicken curry with daal fry, 2 chapati & fresh salad'),
      Tuesday: meal('Kachri Pulao', 'Kachri pulao served with fresh raita'),
      Wednesday: meal('Channa Qeema', 'Channa qeema with 2 chapati & salad'),
      Thursday: meal('Mix Vegetable', 'Mix vegetable sabzi with 2 chapati'),
      Friday: meal('Chicken Biryani', 'Chicken biryani served with raita'),
      Saturday: meal('Kebab Masala', 'Kebab masala with 2 chapati'),
    },
  },
  week2: {
    week: 2,
    days: {
      Monday: meal('Chicken Karahi', 'Desi chicken karahi with 2 chapati'),
      Tuesday: meal('Dal Chawal', 'Dal tadka with steamed rice & salad'),
      Wednesday: meal('Aloo Keema', 'Aloo keema with 2 chapati & salad'),
      Thursday: meal('Anda Curry', 'Egg curry with 2 chapati'),
      Friday: meal('Chicken Yakhni Pulao', 'Aromatic chicken yakhni pulao'),
      Saturday: meal('Shami Kebab', 'Shami kebab with raita, salad & mint sauce'),
    },
  },
  week3: {
    week: 3,
    days: {
      Monday: meal('Chicken Qorma', 'Chicken qorma with 2 chapati & salad'),
      Tuesday: meal('Palak Dal', 'Palak dal with roti'),
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
      Tuesday: meal('Dal Chana', 'Dal chana with roti'),
      Wednesday: meal('Beef Yakhni Pulao', 'Beef yakhni pulao with raita & salad'),
      Thursday: meal('Anda Masala', 'Anda masala with 2 chapati'),
      Friday: meal('Chana Pulao', 'Chana pulao with raita & salad'),
      Saturday: meal('Fried Rice + Chinese Chicken', 'Indo-Chinese special — fried rice with Chinese chicken'),
    },
  },
};

// ===== CONFIG =====
const GROUP_ORDER = { enabled: true, minPacks: 3, discountPercent: 10 };

async function seed() {
  console.log('Seeding plans, add-ons, 4-week rotational menu & config...');

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
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  console.error('\nIf you got PERMISSION_DENIED: temporarily set Firestore rules to');
  console.error('allow write: if true;  then run again and restore the real rules.');
  process.exit(1);
});
