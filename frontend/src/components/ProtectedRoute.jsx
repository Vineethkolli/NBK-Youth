import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loadinghi..</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return children;
}

export default ProtectedRoute;