import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Banknote, Smartphone, MessageCircle } from 'lucide-react';
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
    <footer className="bg-brand-charcoal text-brand-cream mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <Logo light />
          <p className="text-sm text-brand-cream/70 max-w-sm leading-relaxed">
            {BRAND_SUBTAGLINE}. Homemade dinner tiffin subscriptions for bachelors,
            students, families and professionals in {COVERAGE.hub} — 4-week rotating
            menu, 6-day dinner cycle (Monday–Saturday).
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Banknote size={14} /> COD
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Smartphone size={14} /> NayaPay ({NAYAPAY_ACCOUNT.id})
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-brand-mustard">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-brand-cream/80">
            <li><Link to="/menu" className="hover:text-brand-mustard transition">4-Week Menu</Link></li>
            <li><Link to="/plans" className="hover:text-brand-mustard transition">Dinner Packages</Link></li>
            <li><Link to="/checkout" className="hover:text-brand-mustard transition">Subscribe Now</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-mustard transition">My Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-brand-mustard">Contact & Support</h4>
          <ul className="space-y-3 text-sm text-brand-cream/80">
            <li>
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-brand-mustard transition">
                <MessageCircle size={16} className="mt-0.5 shrink-0" /> WhatsApp Order: {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0" /> {WHATSAPP_DISPLAY} (Call / WhatsApp)
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {COVERAGE.hub} — {COVERAGE.detail}
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" /> Dinner: 8:00 - 9:30 PM (Mon–Sat, Sunday off)
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-brand-cream/50">
        © {new Date().getFullYear()} ApnaDastakhwan — Ghar ka Khaana, Sehat bhi!
      </div>
    </footer>
  );
}
