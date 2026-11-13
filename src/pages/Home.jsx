import { useMemo } from 'react';
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
  Users,
  Home as HomeIcon,
  Sparkles,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import {
  COVERAGE,
  WHATSAPP_LINK,
  BRAND_TAGLINE,
  BRAND_SUBTAGLINE,
} from '../utils/constants';
import { STATS, TRUST_BADGES } from '../data/content';
import PlanCard from '../components/PlanCard';
import RotationalMenuTabs from '../components/RotationalMenuTabs';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import Faq from '../components/Faq';
import BrandMark from '../components/BrandMark';
import FullLogo from '../components/FullLogo';
import { useCollection } from '../hooks/useFirestore';

const steps = [
  {
    icon: CalendarCheck,
    title: 'Choose Your Plan',
    desc: 'Monthly, Weekly Trial or a single Daily Tiffin — a 6-day dinner cycle (Mon–Sat).',
  },
  {
    icon: PauseCircle,
    title: 'Customize Schedule',
    desc: 'Pick a start date and Week 1–4 menu. Skip or pause anytime before the 10 PM cut-off.',
  },
  {
    icon: Bike,
    title: 'Fresh Delivery at Your Door',
    desc: 'Hot homemade dinner, delivered 8–9:30 PM across Gulshan-e-Iqbal, Karachi.',
  },
];

const perfectFor = [
  {
    icon: Briefcase,
    title: 'Working Professionals',
    desc: 'Aata jaata, thak jaata — ghar pohanchte hi khana hazir. No cooking stress.',
  },
  {
    icon: Users,
    title: 'Small Families',
    desc: 'Group orders (3+ packs) with a bulk discount — one address, dinner for everyone.',
  },
  {
    icon: HeartHandshake,
    title: 'Chef / Care',
    desc: 'Patients, elderly parents or a shift job — someone dependable brings dinner.',
  },
  {
    icon: HomeIcon,
    title: 'Busy Homemakers',
    desc: 'Kabhi kabhi bas chhutti chahiye hoti hai. Aap din chalo, hum dinner handle karein.',
  },
];

// "Why Choose Us" — straight from the monthly menu flyer
const reasons = [
  {
    icon: HeartHandshake,
    title: 'Homemade with Love',
    desc: 'Zero preservatives, 100% homemade taste — ghar jaisa, sehat ke saath.',
  },
  {
    icon: ShieldCheck,
    title: 'Hygienic & Healthy',
    desc: 'Cooked in a clean home kitchen with quality oil and filtered water.',
  },
  {
    icon: Bike,
    title: 'Timely Delivery',
    desc: 'Hot dinner at your door between 8:00 – 9:30 PM, every single evening.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Variety of Dishes',
    desc: 'A different homemade dish every day across the 4-week rotating menu.',
  },
  {
    icon: Banknote,
    title: 'Pocket-Friendly',
    desc: 'One monthly price for the full cycle. COD or NayaPay, no hidden charges.',
  },
];

export default function Home() {
  const {
    data: planDocs,
    loading,
    error,
    retry,
  } = useCollection('plans');

  const popularPlans = useMemo(
    () =>
      planDocs
        .filter((p) => p.isActive)
        .sort(
          (a, b) => Number(b.isPopular) - Number(a.isPopular) || a.pricePKR - b.pricePKR
        )
        .slice(0, 3),
    [planDocs]
  );

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream via-brand-creamdark to-brand-cream">
        <div
          className="absolute inset-0 bg-dotted opacity-60 mask-fade-b pointer-events-none"
          aria-hidden="true"
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-4 z-10 hidden md:flex items-center gap-2 badge bg-brand-green text-white !text-xs px-4 py-2 shadow-sm">
          <MapPin size={14} aria-hidden="true" /> Now delivering in {COVERAGE.hub}
        </div>

        <div className="container-page relative py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <span className="badge bg-brand-red-ink/10 text-brand-red-ink mb-5 !text-xs px-4 py-2 md:hidden inline-flex">
              <MapPin size={13} aria-hidden="true" /> Now delivering in {COVERAGE.hub}
            </span>

            <span className="eyebrow">
              <Sparkles size={13} aria-hidden="true" /> {BRAND_SUBTAGLINE}
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.08] text-balance">
              Ghar ka Khaana,
              <br />
              <span className="text-brand-red-ink">Sehat Bhi!</span>
            </h1>

            <p className="mt-5 text-lg text-gray-600 max-w-md mx-auto md:mx-0 text-pretty">
              Homemade dinner tiffin subscriptions for bachelors, students and
              professionals in {COVERAGE.hub}. A 4-week rotating menu — har roz kuch
              naya, har roz ghar jaisa.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link to="/plans" className="btn-primary">
                Explore Meal Plans <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-secondary">
                <UtensilsCrossed size={18} aria-hidden="true" /> WhatsApp Quick Order
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-lg mx-auto md:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="text-center md:text-left">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="font-display font-bold text-xl md:text-2xl text-brand-red-ink">
                      {s.value}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">{s.label}</span>
                    <span className="hidden sm:block text-[11px] text-gray-500/80">
                      {s.sub}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual */}
          <Reveal className="hidden md:flex justify-center">
            <div className="relative">
              <div
                className="absolute -inset-8 rounded-full bg-brand-red-ink/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative bg-brand-surface rounded-[2rem] shadow-card-lg p-10 border border-gray-200/70">
                <FullLogo width={290} eager className="mx-auto" />
                <p className="font-display text-lg font-bold text-center mt-4 text-gray-900">
                  {BRAND_TAGLINE}
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-2 text-sm font-semibold text-brand-green-ink">
                  <Moon size={16} aria-hidden="true" /> Dinner, 8:00 – 9:30 PM
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What's included ─────────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-brand-surface">
        <div className="container-page py-8">
          <p className="eyebrow mb-5">What&rsquo;s included?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_BADGES.map((b, i) => (
              <Reveal key={b.title} delay={i * 60}>
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-brand-green-ink shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 text-pretty">{b.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="container-page section">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="How It"
            highlight="Works"
            description="Three simple steps to ghar-ka dinner every day"
          />
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="card card-hover relative h-full">
                <span
                  className="absolute top-4 right-5 font-display text-4xl font-bold text-brand-creamdark"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-brand-red-ink/10 flex items-center justify-center text-brand-red-ink mb-4">
                  <s.icon size={28} aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-gray-900">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 text-pretty">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Perfect for ──────────────────────────────────────────── */}
      <section className="bg-brand-creamdark/60 section">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Who it's for"
              title="Perfect"
              highlight="For"
              description="Made with love, for everyone who misses home food"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {perfectFor.map((c, i) => (
              <Reveal key={c.title} delay={i * 70}>
                <div className="card card-hover text-center h-full">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-green-ink/10 flex items-center justify-center text-brand-green-ink mb-3">
                    <c.icon size={24} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-bold mb-1.5 text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-500 text-pretty">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────────── */}
      <section className="container-page section">
        <Reveal>
          <SectionHeading
            eyebrow="Packages"
            title="Dinner"
            highlight="Packages"
            description="Monthly (24 meals) • Weekly Trial (6 meals) • Daily Tiffin — clear pricing, no hidden charges"
          />
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
          {loading ? (
            <div className="col-span-full">
              <Loader />
            </div>
          ) : error ? (
            <div className="col-span-full">
              <ErrorState
                title="Packages could not be loaded"
                message="We could not reach the kitchen right now. Please try again in a moment."
                onRetry={retry}
              />
            </div>
          ) : (
            popularPlans.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <PlanCard plan={p} />
              </Reveal>
            ))
          )}
        </div>

        {loading ? null : (
          <div className="text-center mt-10">
            <Link to="/plans" className="btn-outline">
              View All Plans <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Rotating menu ────────────────────────────────────────── */}
      <section className="bg-brand-creamdark/60 section">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="This month"
              title="4-Week Rotating"
              highlight="Dinner Menu"
              description="24 unique homemade dishes across 4 weeks — tap a week to peek"
            />
          </Reveal>

          <div className="mt-12">
            <RotationalMenuTabs variant="table" />
          </div>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────────────── */}
      <section className="bg-brand-charcoal text-brand-ivory section">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Why us"
              title="Why"
              highlight="ApnaDastarkhwan?"
              description={BRAND_SUBTAGLINE}
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-12">
            {reasons.map((r, i) => (
              <Reveal key={r.title} delay={i * 70}>
                <div className="h-full bg-white/5 rounded-2xl p-6 border border-white/10 transition duration-200 hover:bg-white/10">
                  <r.icon size={30} className="text-brand-mustard mb-3" aria-hidden="true" />
                  <h3 className="font-display font-bold mb-1.5 text-brand-ivory">
                    {r.title}
                  </h3>
                  <p className="text-sm text-brand-ivory/70 text-pretty">{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/plans" className="btn-primary">
              Start My Subscription <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="container-page section">
        <Reveal>
          <SectionHeading
            eyebrow="Good to know"
            title="Frequently Asked"
            highlight="Questions"
            description="Sab kuch jo aap poochne se pehle jaanna chahte hain"
          />
        </Reveal>

        <div className="mt-12">
          <Faq />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-red px-6 py-14 md:py-20 text-center text-white shadow-card-lg">
            <div
              className="absolute inset-0 bg-dotted opacity-25 pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="inline-flex items-center justify-center rounded-full bg-white p-3 shadow-md">
                <BrandMark size={60} />
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-6 text-balance text-white">
                Aaj se ghar jaisa dinner — rozana
              </h2>
              <p className="mt-3 text-white/85 max-w-xl mx-auto text-pretty">
                Weekly trial se shuru karein — 6 dinners, Mon–Sat, koi hidden charge
                nahi. Kahin bhi pause karein.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/plans"
                  className="inline-flex items-center gap-2 bg-white text-brand-reddark font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg active:translate-y-px transition duration-200"
                >
                  See Plans &amp; Pricing <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-white/80 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition duration-200"
                >
                  <Smartphone size={18} aria-hidden="true" /> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
