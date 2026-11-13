import { Link } from 'react-router-dom';
import { Utensils, Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <Utensils size={48} className="mx-auto text-brand-red-ink mb-4" aria-hidden="true" />
      <p className="font-display text-6xl font-extrabold text-gray-900">404</p>
      <h1 className="text-xl font-bold mt-3 text-gray-800">
        Ye safha nahi mila — but khana mil jayega!
      </h1>
      <p className="text-gray-500 mt-2 mb-8 text-pretty">
        The page you are looking for moved or never existed. Let&rsquo;s get you back to
        something delicious.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-primary">
          <HomeIcon size={18} aria-hidden="true" /> Back to Home
        </Link>
        <Link to="/menu" className="btn-outline">
          See this week&rsquo;s menu
        </Link>
      </div>
    </div>
  );
}
