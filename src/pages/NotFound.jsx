import { Link } from 'react-router-dom';
import { Utensils } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <Utensils size={48} className="mx-auto text-brand-red mb-4" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-500 mb-6">Ye safha nahi mila — but khana mil jayega!</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
