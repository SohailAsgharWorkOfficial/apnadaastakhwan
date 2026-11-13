import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ArrowRight, Check } from 'lucide-react';
import PlanCard from '../components/PlanCard';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import Faq from '../components/Faq';
import { COVERAGE, GROUP_ORDER_DEFAULTS, formatPKR } from '../utils/constants';
import { useCollection, useDocument } from '../hooks/useFirestore';

export default function PlansPage() {
  const {
    data: planDocs,
    loading,
    error,
    retry,
  } = useCollection('plans');

  const { data: addonsDoc } = useDocument('config/addons');
  const addons = addonsDoc?.items || [];

  const sorted = useMemo(
    () =>
      [...planDocs]
        .filter((p) => p.isActive)
        .sort(
          (a, b) => Number(b.isPopular) - Number(a.isPopular) || a.pricePKR - b.pricePKR
        ),
    [planDocs]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Reveal>
        <SectionHeading
          eyebrow="Pricing"
          title="Dinner"
          highlight="Packages & Pricing"
          description="6-day dinner cycle (Monday–Saturday, Sunday off) • Skip or pause anytime before the 10 PM cut-off"
        />
        <div className="inline-flex items-center gap-2 badge bg-brand-green text-white px-4 py-2 mt-5">
          <MapPin size={14} aria-hidden="true" /> Delivery coverage: {COVERAGE.hub} —{' '}
          {COVERAGE.detail}
        </div>
      </Reveal>

      {loading ? (
        <Loader label="Loading packages…" />
      ) : error ? (
        <div className="max-w-xl mx-auto mt-12">
          <ErrorState
            title="Packages could not be loaded"
            message="We could not reach the kitchen right now. Please try again in a moment."
            onRetry={retry}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
          {sorted.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <PlanCard plan={p} />
            </Reveal>
          ))}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="card text-center py-14 max-w-xl mx-auto">
          <p className="text-gray-600 mb-5">
            No packages are published right now. Please check back shortly or order
            directly on WhatsApp.
          </p>
          <Link to="/menu" className="btn-outline">
            See this week&rsquo;s menu
          </Link>
        </div>
      )}

      {/* Group orders */}
      <Reveal>
        <div className="max-w-3xl mx-auto mt-14 card bg-brand-green-ink/5 border-brand-green-ink/20">
          <h2 className="font-display font-bold mb-2 text-center flex items-center justify-center gap-2 text-gray-900">
            <Users size={20} className="text-brand-green-ink" aria-hidden="true" /> Group / Hostel
            Orders
          </h2>
          <p className="text-sm text-gray-600 text-center text-pretty">
            Ordering for {GROUP_ORDER_DEFAULTS.minPacks}+ people at the same address? Select{' '}
            <b>Group Order</b> at checkout and get an automatic bulk discount of{' '}
            <b>{GROUP_ORDER_DEFAULTS.discountPercent}%</b> (set by the ApnaDastarkhwan team).
          </p>
        </div>
      </Reveal>

      {/* Add-ons */}
      {addons.length > 0 && (
        <section className="mt-14 max-w-3xl mx-auto">
          <Reveal>
            <SectionHeading title="Available" highlight="Add-ons" align="center" />
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {addons.map((a, i) => (
              <Reveal key={a.id} delay={i * 50}>
                <div className="card !p-4 flex justify-between items-center gap-3 !rounded-xl">
                  <span className="font-medium text-sm text-gray-800">{a.name}</span>
                  <span className="font-bold text-brand-red-ink text-sm whitespace-nowrap">
                    {formatPKR(a.pricePKR)}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Comparison */}
      {sorted.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <SectionHeading
              title="Compare"
              highlight="Packages"
              description="Sab plans dinner-only hain — sirf duration aur price ka farq hai."
              align="center"
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-x-auto mt-8 rounded-2xl shadow-card">
              <table className="w-full min-w-[560px] bg-brand-surface text-sm">
                <caption className="sr-only">
                  Comparison of dinner package durations, meal counts and prices
                </caption>
                <thead className="bg-brand-charcoal text-brand-ivory">
                  <tr>
                    <th scope="col" className="text-left px-5 py-3.5 font-semibold">
                      Feature
                    </th>
                    {sorted.map((p) => (
                      <th
                        key={p.id}
                        scope="col"
                        className="text-left px-5 py-3.5 font-semibold"
                      >
                        {p.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <th scope="row" className="text-left px-5 py-3 font-medium text-gray-700">
                      Price
                    </th>
                    {sorted.map((p) => (
                      <td key={p.id} className="px-5 py-3 font-semibold text-brand-red-ink">
                        {formatPKR(p.pricePKR)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 bg-brand-creamdark/40">
                    <th scope="row" className="text-left px-5 py-3 font-medium text-gray-700">
                      Dinners
                    </th>
                    {sorted.map((p) => (
                      <td key={p.id} className="px-5 py-3 text-gray-700">
                        {p.totalMeals || '—'} (Mon–Sat)
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <th scope="row" className="text-left px-5 py-3 font-medium text-gray-700">
                      Delivery days
                    </th>
                    {sorted.map((p) => (
                      <td key={p.id} className="px-5 py-3 text-gray-700">
                        {p.durationType === 'daily'
                          ? 'As needed'
                          : p.durationType === 'weekly'
                            ? 'Mon–Sat (1 week)'
                            : 'Mon–Sat (4 weeks)'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200 bg-brand-creamdark/40">
                    <th scope="row" className="text-left px-5 py-3 font-medium text-gray-700">
                      Pause / skip
                    </th>
                    {sorted.map((p) => (
                      <td key={p.id} className="px-5 py-3 text-gray-700">
                        <span className="inline-flex items-center gap-1.5 text-brand-green-ink">
                          <Check size={14} aria-hidden="true" /> Always
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>
      )}

      <Reveal>
        <div className="text-center mt-14">
          <Link to="/menu" className="btn-outline">
            See what&rsquo;s cooking this week <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      <section className="mt-20">
        <Reveal>
          <SectionHeading
            eyebrow="Good to know"
            title="Frequently Asked"
            highlight="Questions"
            description="Plans, payments aur delivery se juri saari baatein"
          />
        </Reveal>
        <div className="mt-10">
          <Faq />
        </div>
      </section>
    </div>
  );
}
