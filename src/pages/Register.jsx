import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) {
      toast.error('Enter a valid Pakistani phone number');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Account created! Welcome to ApnaDastakhwan 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(
        err.code === 'auth/email-already-in-use'
          ? 'This email is already registered'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="text-center mb-8">
        <img src="/logo.png" alt="ApnaDastakhwan" className="h-24 w-24 mx-auto rounded-full object-contain mb-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="text-3xl font-bold">Join the <span className="text-brand-green">Dastarkhwan</span></h1>
        <p className="text-gray-500 mt-1 text-sm">Ghar jaisa khana — rozana, on time</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Ali Khan" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Phone (WhatsApp)</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={form.password} onChange={set('password')} placeholder="Min 6 characters" minLength={6} required />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-sm text-center text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="text-brand-red font-semibold hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
