import { Quote, Star } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore';
import Reveal from './Reveal';

function Stars({ rating = 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={15}
          aria-hidden="true"
          className={i <= rating ? 'text-brand-mustard fill-brand-mustard' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

/**
 * Customer reviews.
 *
 * Reviews are added by the admin from real customers — nothing here is
 * invented, so the section stays honest as the business grows.
 */
export default function Testimonials({ limit = 6, className = '' }) {
  const { data, loading } = useCollection('testimonials', { orderField: 'createdAt' });

  const published = data
    .filter((t) => t.isPublished !== false)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, limit);

  if (loading) {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-brand-creamdark/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!published.length) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed border-gray-300 bg-brand-surface/60 px-6 py-10 text-center ${className}`}
      >
        <Quote size={26} className="mx-auto text-gray-300" aria-hidden="true" />
        <p className="font-display font-bold text-gray-800 mt-3">
          Reviews land here soon
        </p>
        <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
          We ask every customer how their dinners went, and publish their words here
          as they are — no editing, no invention.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {published.map((t, i) => (
        <Reveal key={t.id} delay={i * 60}>
          <figure className="h-full card card-hover flex flex-col">
            <Quote size={22} className="text-brand-red-ink/30 mb-2" aria-hidden="true" />
            <blockquote className="text-sm text-gray-600 leading-relaxed flex-1 text-pretty">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                {t.area && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{t.area}</p>
                )}
              </div>
              <Stars rating={t.rating || 5} />
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
