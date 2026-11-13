import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FullLogo from '../components/FullLogo';
import FormErrorSummary from '../components/FormErrorSummary';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const next = [];
    if (!form.name.trim()) {
      next.push({ field: 'name', href: '#name', message: 'Enter your full name' });
    }
    if (!form.email.trim()) {
      next.push({ field: 'email', href: '#email', message: 'Enter your email address' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.push({
        field: 'email',
        href: '#email',
        message: 'Enter a valid email address, e.g. you@example.com',
      });
    }
    if (!form.phone.trim()) {
      next.push({ field: 'phone', href: '#phone', message: 'Enter your WhatsApp number' });
    } else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      next.push({
        field: 'phone',
        href: '#phone',
        message: 'Enter a valid Pakistani phone number, e.g. 0300-1234567',
      });
    }
    if (!form.password) {
      next.push({ field: 'password', href: '#password', message: 'Choose a password' });
    } else if (form.password.length < 6) {
      next.push({
        field: 'password',
        href: '#password',
        message: 'Password must be at least 6 characters',
      });
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim());
      toast.success('Account created! Welcome to ApnaDastarkhwan');
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'This email is already registered — try logging in instead.'
          : err.code === 'auth/weak-password'
            ? 'Password must be at least 6 characters'
            : err.code === 'auth/invalid-email'
              ? 'Enter a valid email address'
              : err.message || 'Unable to create your account right now. Please try again.';

      setErrors([{ field: 'form', message }]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasFieldError = (name) => errors.some((err) => err.field === name);
  const fieldError = (name) => errors.find((err) => err.field === name)?.message;

  return (
    <div className="max-w-md mx-auto px-4 py-14 sm:py-20">
      <div className="text-center mb-8">
        <FullLogo width={200} eager className="mx-auto" />
        <h1 className="text-3xl font-bold mt-5">
          Join the <span className="text-brand-green-ink">Dastarkhwan</span>
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">Ghar jaisa khana — rozana, on time</p>
      </div>

      <form onSubmit={handleSubmit} className="card" noValidate>
        <FormErrorSummary
          errors={errors.filter(
            (e) => !['name', 'email', 'phone', 'password'].includes(e.field)
          )}
        />

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Full Name <span className="text-brand-red-ink">*</span>
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className={`input ${hasFieldError('name') ? 'input-error' : ''}`}
              value={form.name}
              onChange={set('name')}
              placeholder="Ali Khan"
              aria-invalid={hasFieldError('name') || undefined}
              aria-describedby={hasFieldError('name') ? 'name-error' : undefined}
              required
            />
            {hasFieldError('name') && (
              <p id="name-error" className="hint text-red-600 dark:text-red-300">
                {fieldError('name')}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email <span className="text-brand-red-ink">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`input ${hasFieldError('email') ? 'input-error' : ''}`}
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              aria-invalid={hasFieldError('email') || undefined}
              aria-describedby={hasFieldError('email') ? 'email-error' : undefined}
              required
            />
            {hasFieldError('email') && (
              <p id="email-error" className="hint text-red-600 dark:text-red-300">
                {fieldError('email')}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone (WhatsApp) <span className="text-brand-red-ink">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={`input ${hasFieldError('phone') ? 'input-error' : ''}`}
              value={form.phone}
              onChange={set('phone')}
              placeholder="0300-1234567"
              aria-invalid={hasFieldError('phone') || undefined}
              aria-describedby={
                hasFieldError('phone') ? 'phone-error phone-hint'
              : 'phone-hint'
              }
              required
            />
            {hasFieldError('phone') ? (
              <p id="phone-error" className="hint text-red-600 dark:text-red-300">
                {fieldError('phone')}
              </p>
            ) : (
              <p id="phone-hint" className="hint">
                We use this number for delivery updates.
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password <span className="text-brand-red-ink">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input pr-12 ${hasFieldError('password') ? 'input-error' : ''}`}
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                minLength={6}
                aria-invalid={hasFieldError('password') || undefined}
                aria-describedby={
                  hasFieldError('password') ? 'password-error' : undefined
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-lg
                  text-gray-500 hover:text-brand-red-ink hover:bg-brand-red-ink/10
                  transition duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </div>
            {hasFieldError('password') && (
              <p id="password-error" className="hint text-red-600 dark:text-red-300">
                {fieldError('password')}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            <UserPlus size={18} aria-hidden="true" />
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="text-sm text-center text-gray-500">
            Already registered?{' '}
            <Link
              to="/login"
              className="text-brand-red-ink font-semibold hover:underline underline-offset-2"
            >
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
