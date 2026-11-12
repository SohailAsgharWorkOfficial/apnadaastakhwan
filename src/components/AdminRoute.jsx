import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
