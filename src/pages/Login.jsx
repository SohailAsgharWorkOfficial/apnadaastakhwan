import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Khana intezar kar raha hai 🍲');
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      toast.error(
        err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
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
        <h1 className="text-3xl font-bold">Welcome <span className="text-brand-red">Back</span></h1>
        <p className="text-gray-500 mt-1 text-sm">Login to manage your tiffin subscription</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-sm text-center text-gray-500">
          New here?{' '}
          <Link to="/register" className="text-brand-red font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
