import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" text="Loading..." />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role !== role)
    return <Navigate to={`/${user.role}/dashboard`} replace />;

  return children;
}