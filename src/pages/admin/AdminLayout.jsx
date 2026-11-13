import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Bike,
  LogOut,
  MessageSquareQuote,
  Menu,
  X,
  ExternalLink,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';
import ScrollToTop from '../../components/ScrollToTop';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, group: 'Kitchen' },
  { to: '/admin/delivery', label: 'Delivery Sheet', icon: Bike, group: 'Kitchen' },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, group: 'Manage' },
  { to: '/admin/menu', label: 'Menu Editor', icon: UtensilsCrossed, group: 'Manage' },
  { to: '/admin/plans', label: 'Plans & Pricing', icon: Package, group: 'Manage' },
  { to: '/admin/testimonials', label: 'Customer Reviews', icon: MessageSquareQuote, group: 'Manage' },
];

export default function AdminLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const groups = [...new Set(navItems.map((n) => n.group))];

  const sidebar = (
    <>
      <div className="px-4 pt-5 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-ivory/40">
          Admin panel
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-ivory/35">
              {group}
            </p>
            <ul className="space-y-1">
              {navItems
                .filter((n) => n.group === group)
                .map((n) => (
                  <li key={n.to}>
                    <NavLink
                      to={n.to}
                      end={n.end}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-brand-charcoal
                        ${
                          isActive
                            ? 'bg-brand-red text-white shadow-md'
                            : 'text-brand-ivory/70 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <n.icon
                            size={17}
                            aria-hidden="true"
                            className={isActive ? 'text-white' : 'text-brand-ivory/60 group-hover:text-white'}
                          />
                          <span className="flex-1">{n.label}</span>
                          {isActive && <ChevronRight size={14} aria-hidden="true" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-ivory/70 hover:bg-white/10 hover:text-white transition duration-200"
        >
          <ExternalLink size={17} aria-hidden="true" />
          Back to website
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/15 transition duration-200"
        >
          <LogOut size={17} aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-brand-charcoal text-brand-ivory flex items-center gap-3 px-4 no-print">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl text-brand-ivory/80 hover:bg-white/10 transition"
          aria-label="Open admin menu"
          aria-expanded={drawerOpen}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Logo light size="sm" />

        <span className="hidden sm:inline-flex items-center text-[11px] font-bold uppercase tracking-[0.18em] text-brand-ivory/40 border-l border-white/15 pl-3 ml-1">
          Admin
        </span>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ivory/75 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <ExternalLink size={14} aria-hidden="true" /> View site
          </Link>

          <ThemeToggle className="h-9 w-9 text-brand-ivory/80 hover:bg-white/10 hover:text-brand-mustard" />

          <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:ml-1 sm:border-l sm:border-white/15">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-red text-white text-xs font-bold shrink-0">
              {(profile?.name || 'A').trim().charAt(0).toUpperCase()}
            </span>
            <span className="hidden md:block text-sm font-medium leading-tight">
              {profile?.name || 'Admin'}
              <span className="block text-[10px] uppercase tracking-wider text-brand-ivory/45">
                Administrator
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex fixed top-16 bottom-0 left-0 w-64 flex-col bg-brand-charcoal text-brand-ivory z-30 no-print">
        {sidebar}
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 no-print">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close admin menu"
          />
          <aside className="absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] flex flex-col bg-brand-charcoal text-brand-ivory shadow-2xl animate-slide-down">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-brand-ivory/80 hover:bg-white/10 transition"
                aria-label="Close admin menu"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="md:pl-64 pt-16 min-w-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}
