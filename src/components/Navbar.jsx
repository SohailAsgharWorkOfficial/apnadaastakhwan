import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'text-brand-red bg-brand-red/10'
        : 'text-brand-charcoal hover:text-brand-red hover:bg-brand-red/5'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-creamdark shadow-sm no-print">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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
              className="relative p-2 rounded-lg hover:bg-brand-red/10 text-brand-red"
              title="Continue checkout"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-green animate-pulse" />
            </Link>
          )}
          {user ? (
            <>
              {profile?.role === 'admin' && (
                <Link to="/admin" className="btn-secondary !px-3 !py-2 text-sm">
                  <LayoutDashboard size={16} /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-primary !px-3 !py-2 text-sm">
                <LayoutDashboard size={16} /> My Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 hover:text-brand-red hover:bg-brand-red/10"
                title="Logout"
              >
                <LogOut size={18} />
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

        <button
          className="md:hidden p-2 rounded-lg hover:bg-brand-red/10"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-brand-creamdark bg-brand-cream px-4 py-3 space-y-1">
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
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkCls} onClick={() => setOpen(false)}>
                My Dashboard
              </NavLink>
              {profile?.role === 'admin' && (
                <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>
                  Admin Panel
                </NavLink>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                  toast('Logged out');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-outline flex-1 !py-2 text-sm" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn-primary flex-1 !py-2 text-sm" onClick={() => setOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
