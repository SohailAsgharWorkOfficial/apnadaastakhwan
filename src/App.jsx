import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import PlansPage from './pages/PlansPage';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import NotFound from './pages/NotFound';
import AdminOverview from './pages/admin/AdminOverview';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminPlans from './pages/admin/AdminPlans';
import AdminDelivery from './pages/admin/AdminDelivery';
import WhatsAppFloat from './components/WhatsAppFloat';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
