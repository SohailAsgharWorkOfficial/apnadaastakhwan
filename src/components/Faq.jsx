import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FAQS } from '../data/content';
import Reveal from './Reveal';

/**
 * Accessible accordion — each header is a real <button> that exposes
 * aria-expanded / aria-controls, and the panel is a labelled region.
 */
export default function Faq({ items = FAQS, className = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className={`max-w-3xl mx-auto space-y-3 ${className}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;

        return (
          <Reveal key={item.q} delay={i * 40}>
            <div
              className={`overflow-hidden rounded-2xl border bg-brand-surface transition-colors duration-200 ${
                isOpen ? 'border-brand-red-ink/35 shadow-card' : 'border-gray-200'
              }`}
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4
                    font-semibold text-gray-800 hover:bg-brand-red-ink/5
                    transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red-ink"
                >
                  <span className="text-[15px] sm:text-base">{item.q}</span>
                  <span
                    className={`inline-flex shrink-0 items-center justify-center h-7 w-7 rounded-full
                      bg-brand-red-ink/10 text-brand-red-ink
                      transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-5 pb-5 -mt-1"
              >
                <p className="text-gray-500 text-sm leading-relaxed text-pretty">{item.a}</p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
