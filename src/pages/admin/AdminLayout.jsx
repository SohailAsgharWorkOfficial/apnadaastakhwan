import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Bike,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders & Subscriptions', icon: ClipboardList },
  { to: '/admin/menu', label: 'Weekly Menu Editor', icon: UtensilsCrossed },
  { to: '/admin/plans', label: 'Plans & Pricing', icon: Package },
  { to: '/admin/delivery', label: 'Delivery Sheet', icon: Bike },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 bg-brand-charcoal text-brand-ivory md:min-h-full p-5 no-print">
        <div className="hidden md:block mb-6">
          <Logo light size="sm" />
        </div>
        <p className="text-xs uppercase tracking-wider text-brand-ivory/60 mb-3">Admin Panel</p>
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard
                ${
                  isActive
                    ? 'bg-brand-red text-white shadow'
                    : 'text-brand-ivory/85 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <n.icon size={17} aria-hidden="true" /> {n.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 transition whitespace-nowrap mt-2
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogOut size={17} aria-hidden="true" /> Logout
          </button>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-brand-cream p-4 md:p-8 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
