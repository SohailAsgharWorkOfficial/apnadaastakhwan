import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FullLogo from '../components/FullLogo';
import FormErrorSummary from '../components/FormErrorSummary';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const validate = () => {
    const next = [];
    if (!email.trim()) {
      next.push({ field: 'email', href: '#email', message: 'Enter your email address' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.push({
        field: 'email',
        href: '#email',
        message: 'Enter a valid email address, e.g. you@example.com',
      });
    }
    if (!password) {
      next.push({ field: 'password', href: '#password', message: 'Enter your password' });
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
      await login(email.trim(), password);
      toast.success('Welcome back! Khana intezar kar raha hai');
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      const message =
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please try again.'
          : err.message || 'Unable to log in right now. Please try again.';

      setErrors([{ field: 'form', message }]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasFieldError = (name) => errors.some((err) => err.field === name);

  return (
    <div className="max-w-md mx-auto px-4 py-14 sm:py-20">
      <div className="text-center mb-8">
        <FullLogo width={200} eager className="mx-auto" />
        <h1 className="text-3xl font-bold mt-5">
          Welcome <span className="text-brand-red-ink">Back</span>
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Login to manage your tiffin subscription
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="card" noValidate>
        <FormErrorSummary
          errors={errors.filter((e) => e.field !== 'email' && e.field !== 'password')}
        />

        <div className="space-y-4">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={hasFieldError('email') || undefined}
              aria-describedby={hasFieldError('email') ? 'email-error' : undefined}
              required
            />
            {hasFieldError('email') && (
              <p id="email-error" className="hint text-red-600 dark:text-red-300">
                {errors.find((e) => e.field === 'email')?.message}
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
                autoComplete="current-password"
                className={`input pr-12 ${hasFieldError('password') ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={hasFieldError('password') || undefined}
                aria-describedby={hasFieldError('password') ? 'password-error' : undefined}
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
                {errors.find((e) => e.field === 'password')?.message}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            <LogIn size={18} aria-hidden="true" />
            {loading ? 'Logging in…' : 'Login'}
          </button>

          <p className="text-sm text-center text-gray-500">
            New here?{' '}
            <Link
              to="/register"
              className="text-brand-red-ink font-semibold hover:underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
