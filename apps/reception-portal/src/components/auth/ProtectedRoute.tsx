import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[#F4510B]" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading Reception Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'RECEPTION') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}