import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import Loader from './components/Loader';
import WhatsAppFloat from './components/WhatsAppFloat';

import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import WhatsCooking from './pages/WhatsCooking';
import PlansPage from './pages/PlansPage';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import NotFound from './pages/NotFound';

// Admin surfaces are heavy and rarely visited — keep them out of the main bundle.
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'));
const AdminDelivery = lazy(() => import('./pages/admin/AdminDelivery'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Suspense fallback={<Loader full />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/whats-cooking" element={<WhatsCooking />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="delivery" element={<AdminDelivery />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <WhatsAppFloat />
      <ScrollToTop />
    </div>
  );
}
