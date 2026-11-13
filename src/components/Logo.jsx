import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

const dims = {
  sm: { mark: 34, text: 'text-lg sm:text-xl' },
  md: { mark: 42, text: 'text-xl sm:text-2xl' },
  lg: { mark: 96, text: 'text-3xl sm:text-4xl' },
};

export default function Logo({ size = 'md', light = false }) {
  const { mark, text } = dims[size] || dims.md;

  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2 sm:gap-2.5 rounded-lg min-w-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
        focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
      aria-label="ApnaDastarkhwan — go to home"
    >
      <BrandMark
        size={mark}
        eager
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      />

      <span
        className={`font-script leading-[1.05] whitespace-nowrap ${text} ${
          light ? 'text-brand-ivory' : 'text-gray-900'
        }`}
      >
        <span className={light ? 'text-brand-green-inverse' : 'text-brand-wordmark-green'}>
          Apna
        </span>
        <span className={light ? 'text-brand-red-inverse' : 'text-brand-wordmark-red'}>
          Dastarkhwan
        </span>
      </span>
    </Link>
  );
}
