import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Loader from './components/Loader';

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
    <Routes>
      {/* ── Public site ─────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
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
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ── Admin app (own chrome, no public header/footer) ──────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<Loader full />}>
              <AdminOverview />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<Loader full />}>
              <AdminOrders />
            </Suspense>
          }
        />
        <Route
          path="menu"
          element={
            <Suspense fallback={<Loader full />}>
              <AdminMenu />
            </Suspense>
          }
        />
        <Route
          path="plans"
          element={
            <Suspense fallback={<Loader full />}>
              <AdminPlans />
            </Suspense>
          }
        />
        <Route
          path="delivery"
          element={
            <Suspense fallback={<Loader full />}>
              <AdminDelivery />
            </Suspense>
          }
        />
        <Route
          path="testimonials"
          element={
            <Suspense fallback={<Loader full />}>
              <AdminTestimonials />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
