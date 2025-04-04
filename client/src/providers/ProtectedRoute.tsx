import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { RootState } from '@/redux/store';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page but preserve the intended destination
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  // Only render the child components when authenticated
  return isAuthenticated ? <Outlet /> : null;
};

export default ProtectedRoute;