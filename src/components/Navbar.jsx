import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: '4-Week Menu' },
  { to: '/plans', label: 'Packages' },
];

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { plan } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
      isActive
        ? 'text-brand-red-ink bg-brand-red-ink/10'
        : 'text-gray-600 hover:text-brand-red-ink hover:bg-brand-red-ink/5'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/85 backdrop-blur-md border-b border-gray-200/80 shadow-sm no-print">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {plan && (
            <Link
              to="/checkout"
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl
                text-brand-red-ink hover:bg-brand-red-ink/10
                transition duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
                focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
              title="Continue checkout"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-green-ink animate-pulse" />
              <span className="sr-only" role="status">
                {plan.title} selected. Continue to checkout.
              </span>
            </Link>
          )}

          <ThemeToggle />

          {user ? (
            <>
              {profile?.role === 'admin' && (
                <Link to="/admin" className="btn-secondary !px-3 !py-2 text-sm">
                  <LayoutDashboard size={16} aria-hidden="true" /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-primary !px-3 !py-2 text-sm">
                <LayoutDashboard size={16} aria-hidden="true" /> My Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl
                  text-gray-500 hover:text-brand-red-ink hover:bg-brand-red-ink/10
                  transition duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline !px-4 !py-2 text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle className="h-9 w-9" />
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl
              text-gray-700 hover:bg-brand-red-ink/10
              transition duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
              focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close main menu' : 'Open main menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-200 bg-brand-cream px-4 py-4 space-y-1 animate-slide-down"
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={linkCls}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}

          {plan && (
            <NavLink
              to="/checkout"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-brand-red-ink"
              onClick={() => setOpen(false)}
            >
              <ShoppingCart size={16} aria-hidden="true" /> Continue checkout
              <span className="sr-only" role="status">
                {plan.title} selected.
              </span>
            </NavLink>
          )}

          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                My Dashboard
              </NavLink>
              {profile?.role === 'admin' && (
                <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>
                  <span className="inline-flex items-center gap-2">
                    <ClipboardList size={16} aria-hidden="true" /> Admin Panel
                  </span>
                </NavLink>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                  toast('Logged out');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-brand-red-ink hover:bg-brand-red-ink/5"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                className="btn-outline flex-1 !py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary flex-1 !py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
