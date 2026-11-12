import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', light = false }) {
  const dims = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-24 w-24',
  };
  const text = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-4xl',
  };
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src="/logo.png"
        alt="ApnaDastakhwan logo"
        className={`${dims[size]} rounded-full bg-white object-contain shadow-sm ring-1 ring-brand-creamdark group-hover:scale-105 transition`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <span
        className={`font-display font-bold leading-none ${text[size]} ${
          light ? 'text-white' : 'text-brand-charcoal'
        }`}
      >
        Apna<span className="text-brand-red">Dasta</span>
        <span className="text-brand-green">rkhwan</span>
      </span>
    </Link>
  );
}
