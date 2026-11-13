import { Link } from 'react-router-dom';
import { ArrowRight, Plus, UtensilsCrossed, Download, Printer, ImageIcon } from 'lucide-react';
import RotationalMenuTabs from '../components/RotationalMenuTabs';
import Loader from '../components/Loader';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import { WHATSAPP_LINK } from '../utils/constants';
import { useDocument } from '../hooks/useFirestore';

export default function MenuPage() {
  const { data: addonsDoc, loading } = useDocument('config/addons');
  const addons = addonsDoc?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Reveal>
        <SectionHeading
          eyebrow="Weekly rotation"
          title="4-Week Rotational"
          highlight="Dinner Menu"
          description="24 homemade dishes rotating across Week 1–4, Monday to Saturday (Sunday off). Every dinner is the same for everyone that night — fresh, hygienic, made with love."
        />
      </Reveal>

      {/* ── Menu flyer ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="mt-12 grid lg:grid-cols-[minmax(0,400px)_1fr] gap-10 items-center card overflow-hidden">
          <figure className="relative">
            <img
              src="/menu-flyer.jpg"
              alt="ApnaDastarkhwan monthly dinner menu flyer — 4-week rotating menu, prices, delivery area and contact details"
              width={687}
              height={1090}
              loading="lazy"
              decoding="async"
              className="w-full rounded-xl border border-gray-200 shadow-card"
            />
          </figure>

          <div>
            <span className="eyebrow">
              <ImageIcon size={13} aria-hidden="true" /> Save it for later
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-balance">
              The complete <span className="text-brand-red-ink">monthly menu flyer</span>
            </h2>
            <p className="mt-3 text-gray-500 text-pretty">
              One page with the full 4-week dinner cycle, the monthly package price, what&rsquo;s
              included, delivery area, group-order details and how to order. Save it to your phone
              or share it with your hostel / family group.
            </p>

            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-gray-600">
              {[
                'Monthly package — Rs. 12,000 (24 dinners)',
                '4-week complete menu, 6 dishes per week',
                'Delivery in Gulshan-e-Iqbal, Block 16',
                'Group orders — 3+ packs to one address',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-red-ink shrink-0"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/menu-flyer.jpg" download="ApnaDastarkhwan-Monthly-Dinner-Menu.jpg" className="btn-primary">
                <Download size={17} aria-hidden="true" /> Download flyer
              </a>
              <button
                type="button"
                onClick={() => window.open('/menu-flyer.jpg', '_blank', 'noopener,noreferrer')}
                className="btn-outline"
              >
                <Printer size={17} aria-hidden="true" /> Open full size
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mt-14">
        <RotationalMenuTabs variant="cards" />
      </div>

      {loading ? (
        <Loader label="Loading add-ons…" />
      ) : (
        addons.length > 0 && (
          <section className="mt-16">
            <Reveal>
              <SectionHeading
                align="center"
                title="Add-ons"
                highlight="& Extras"
                description="Attach extras to your subscription at checkout."
              />
            </Reveal>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
              {addons.map((a, i) => (
                <Reveal key={a.id} delay={i * 60}>
                  <div className="card !p-4 flex items-center justify-between gap-3 h-full">
                    <p className="font-semibold text-sm text-gray-800">{a.name}</p>
                    <p className="text-brand-red-ink font-bold text-sm whitespace-nowrap">
                      Rs. {a.pricePKR}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1.5">
              <Plus size={13} aria-hidden="true" /> Add-ons can be attached to your
              subscription at checkout.
            </p>
          </section>
        )
      )}

      <div className="text-center mt-14 flex flex-wrap gap-3 justify-center">
        <Link to="/plans" className="btn-primary">
          Go to Meal Plans <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          <UtensilsCrossed size={18} aria-hidden="true" /> Order Today&rsquo;s Box on WhatsApp
        </a>
      </div>
    </div>
  );
}
