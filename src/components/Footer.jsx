import { Link } from 'react-router-dom';
import {
  Phone,
  MapPin,
  Clock,
  Banknote,
  Smartphone,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import Logo from './Logo';
import {
  WHATSAPP_LINK,
  WHATSAPP_DISPLAY,
  NAYAPAY_ACCOUNT,
  COVERAGE,
  BRAND_SUBTAGLINE,
} from '../utils/constants';

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-brand-ivory mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <Logo light />
          <p className="text-sm text-brand-ivory/75 max-w-sm leading-relaxed">
            {BRAND_SUBTAGLINE}. Homemade dinner tiffin subscriptions for bachelors,
            students, families and professionals in {COVERAGE.hub} — 4-week rotating
            menu, 6-day dinner cycle (Monday–Saturday).
          </p>
          <div className="flex flex-wrap gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-brand-ivory/90">
              <Banknote size={14} aria-hidden="true" /> Cash on Delivery
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-brand-ivory/90">
              <Smartphone size={14} aria-hidden="true" /> NayaPay ({NAYAPAY_ACCOUNT.id})
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg mb-4 text-brand-mustard">Quick Links</h2>
          <ul className="space-y-2.5 text-sm text-brand-ivory/85">
            <li>
              <Link
                to="/menu"
                className="inline-flex items-center gap-1.5 hover:text-brand-mustard transition duration-200"
              >
                4-Week Menu
              </Link>
            </li>
            <li>
              <Link
                to="/plans"
                className="inline-flex items-center gap-1.5 hover:text-brand-mustard transition duration-200"
              >
                Dinner Packages
              </Link>
            </li>
            <li>
              <Link
                to="/checkout"
                className="inline-flex items-center gap-1.5 hover:text-brand-mustard transition duration-200"
              >
                Subscribe Now
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 hover:text-brand-mustard transition duration-200"
              >
                My Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 hover:text-brand-mustard transition duration-200"
              >
                Login / Register
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg mb-4 text-brand-mustard">Contact & Support</h2>
          <ul className="space-y-3 text-sm text-brand-ivory/85">
            <li>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2 hover:text-brand-mustard transition duration-200"
              >
                <MessageCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                WhatsApp Order: {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {WHATSAPP_DISPLAY} (Call / WhatsApp)
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {COVERAGE.hub} — {COVERAGE.detail}
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Dinner: 8:00 – 9:30 PM (Mon–Sat, Sunday off)
            </li>
          </ul>

          <Link to="/plans" className="btn-primary mt-5 !px-4 !py-2.5 text-sm">
            Start my subscription <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-brand-ivory/65">
        © {new Date().getFullYear()} ApnaDastarkhwan — Ghar ka Khaana, Sehat bhi!
      </div>
    </footer>
  );
}
