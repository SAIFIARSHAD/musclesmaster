import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// function Dashboard() {
//   return (
//     <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
//       <h1 className="text-3xl font-bold">Dashboard (Protected)</h1>
//       <p className="mt-4 text-gray-300">You are logged in!</p>
//     </div>
//   );
// }

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-300">
            Welcome, {user?.name || 'Admin'}!
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      {/* Forgot Password Route */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Reset Password Route */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}