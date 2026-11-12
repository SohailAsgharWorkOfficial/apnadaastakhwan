import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  UtensilsCrossed,
  Bike,
  ShieldCheck,
  HeartHandshake,
  PauseCircle,
  Banknote,
  Smartphone,
  ArrowRight,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Home as HomeIcon,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
  COVERAGE,
  WHATSAPP_LINK,
  BRAND_TAGLINE,
  BRAND_SUBTAGLINE,
} from '../utils/constants';
import PlanCard from '../components/PlanCard';
import RotationalMenuTabs from '../components/RotationalMenuTabs';
import Loader from '../components/Loader';

const steps = [
  { icon: CalendarCheck, title: 'Choose Your Plan', desc: 'Monthly, Weekly Trial or a single Daily Tiffin — 6-day dinner cycle (Mon–Sat).' },
  { icon: PauseCircle, title: 'Customize Schedule', desc: 'Pick start date & Week 1-4 menu. Skip or pause anytime before 10 PM cutoff.' },
  { icon: Bike, title: 'Fresh Delivery at Doorstep', desc: 'Hot homemade dinner, delivered 8-9:30 PM across Gulshan-e-Iqbal, Karachi.' },
];

const perfectFor = [
  { icon: Briefcase, title: 'Working Professionals', desc: 'Aata jaata, thak jaata — ghar pohanchte hi khana hazir. No cooking stress.' },
  { icon: GraduationCap, title: 'Bachelors / Hostelites', desc: 'Hostel ka khana? Nahi bhai. Rotational desi menu that changes every week.' },
  { icon: Users, title: 'Small Families', desc: 'Group orders (3+ packs) with bulk discount — ek hi address, sab ke liye.' },
  { icon: HomeIcon, title: 'Busy Homemakers', desc: 'Kabhi kabhi bas chhutti chahiye hoti hai. Aap din chalo, hum dinner handle karein.' },
];

const reasons = [
  { icon: ShieldCheck, title: 'Hygiene First', desc: 'Cooked in a clean home kitchen with quality oil & filtered water. No compromise.' },
  { icon: HeartHandshake, title: 'Made With Love', desc: 'Zero preservatives, 100% homemade taste — ghar jaisa, sehat ke saath.' },
  { icon: PauseCircle, title: 'Flexible Pause / Skip', desc: 'Going home for the weekend? Pause your tiffin online before 10 PM.' },
  { icon: Banknote, title: 'COD & NayaPay', desc: 'Cash on Delivery or NayaPay transfer with instant screenshot verification.' },
];

export default function Home() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'plans'), (snap) => {
      setPlans(snap.docs.filter((d) => d.data().isActive).map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const popularPlans = plans.filter((p) => p.isPopular).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-creamdark to-brand-cream overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-4 z-10 hidden md:flex items-center gap-2 badge bg-brand-green text-white !text-xs px-4 py-2 shadow">
          <MapPin size={14} /> Now delivering in {COVERAGE.hub}
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left">
            <span className="badge bg-brand-red/10 text-brand-red mb-4 !text-xs px-4 py-2 md:hidden flex items-center gap-2">
              <MapPin size={13} /> Now delivering in {COVERAGE.hub}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mt-2 md:mt-0">
              Ghar ka Khaana,<br />
              <span className="text-brand-red">Sehat Bhi!</span>
            </h1>
            <p className="mt-3 text-brand-wood font-semibold">{BRAND_SUBTAGLINE}</p>
            <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto md:mx-0">
              Homemade dinner tiffin subscriptions for bachelors, students &
              professionals in {COVERAGE.hub}. 4-week rotating menu — har roz kuch naya,
              har roz ghar jaisa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link to="/plans" className="btn-primary">
                Explore Meal Plans <ArrowRight size={18} />
              </Link>
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-secondary">
                <UtensilsCrossed size={18} /> WhatsApp Quick Order
              </a>
            </div>
            <div className="mt-8 flex gap-6 text-sm justify-center md:justify-start">
              <div><span className="font-display font-bold text-xl text-brand-red">24</span><p className="text-gray-500">Dishes / Month</p></div>
              <div><span className="font-display font-bold text-xl text-brand-red">Mon–Sat</span><p className="text-gray-500">Dinner Cycle</p></div>
              <div><span className="font-display font-bold text-xl text-brand-red">8 PM</span><p className="text-gray-500">At Your Door</p></div>
            </div>
          </div>
          <div className="relative hidden md:block text-center">
            <img
              src="/logo.png"
              alt="ApnaDastakhwan"
              className="w-full max-w-md mx-auto drop-shadow-xl"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <p className="font-display text-lg text-brand-green mt-2">{BRAND_TAGLINE}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center">How It <span className="text-brand-green">Works</span></h2>
        <p className="text-center text-gray-500 mt-2 mb-10">Three simple steps to ghar-ka-dinner every day</p>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card text-center relative">
              <span className="absolute top-4 right-5 font-display text-4xl font-bold text-brand-creamdark">{i + 1}</span>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red mb-4">
                <s.icon size={28} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perfect For */}
      <section className="bg-brand-creamdark/60 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">
            Perfect <span className="text-brand-red">For</span>
          </h2>
          <p className="text-center text-gray-500 mt-2 mb-10">Made with love, for everyone who misses home food</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perfectFor.map((c, i) => (
              <div key={i} className="card text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-3">
                  <c.icon size={24} />
                </div>
                <h3 className="font-display font-bold mb-1.5">{c.title}</h3>
                <p className="text-sm text-gray-500">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Showcase */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center">Dinner <span className="text-brand-red">Packages</span></h2>
        <p className="text-center text-gray-500 mt-2 mb-10">Monthly (24 meals) • Weekly Trial (6 meals) • Daily Tiffin — clear pricing, no hidden charges</p>
        {loading ? (
          <Loader />
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {popularPlans.map((p) => <PlanCard key={p.id} plan={p} />)}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/plans" className="btn-outline">View All Plans <ArrowRight size={18} /></Link>
        </div>
      </section>

      {/* 4-Week Rotational Menu */}
      <section className="bg-brand-creamdark/60 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">4-Week Rotating <span className="text-brand-green">Dinner Menu</span></h2>
          <p className="text-center text-gray-500 mt-2 mb-8">
            24 unique homemade dishes across 4 weeks — tap a week to peek
          </p>
          <RotationalMenuTabs variant="table" />
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-brand-charcoal text-brand-cream py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center">Why <span className="text-brand-mustard">ApnaDastakhwan?</span></h2>
          <p className="text-center text-brand-cream/60 mt-2 mb-10">{BRAND_SUBTAGLINE}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <r.icon size={30} className="text-brand-mustard mb-3" />
                <h3 className="font-display font-bold mb-1.5">{r.title}</h3>
                <p className="text-sm text-brand-cream/60">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/plans" className="btn-primary">Start My Subscription <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
