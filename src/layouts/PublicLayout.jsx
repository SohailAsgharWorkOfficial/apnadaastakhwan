import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppFloat from '../components/WhatsAppFloat';
import ScrollToTop from '../components/ScrollToTop';
import Loader from '../components/Loader';

/**
 * The public-facing shell. Admin routes deliberately do NOT use this — the
 * admin panel is a standalone app with its own chrome.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Suspense fallback={<Loader full />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      <WhatsAppFloat />
      <ScrollToTop />
    </div>
  );
}
