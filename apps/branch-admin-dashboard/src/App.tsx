import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MembershipsPage from './pages/MembershipsPage';
import FreezeRequestsPage from './pages/FreezeRequestsPage';
import AttendancePage from './pages/AttendancePage';
import StaffManagementPage from './pages/StaffManagementPage';
import { PaymentDashboard } from '@repo/payment-module';
import { PaymentCollectionForm } from '@repo/payment-module';
import { PaymentHistory } from '@repo/payment-module';

import DashboardLayout from './components/layout/DashboardLayout';

import { useAuth } from './context/AuthContext';
import MembersPage from './pages/MembersPage';
import MembershipPlansPage from './pages/MembershipPlansPage';

const LoginRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'BRANCH_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

const ComingSoonPage = ({ title }: { title: string }) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
        <span className="text-2xl font-bold">M</span>
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#14243B]">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        This module is currently under development. It will be
        available soon in your Branch Admin panel.
      </p>

      <span className="mt-5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#F4510B]">
        Coming Soon
      </span>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      {/* Protected Branch Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route path="/members" element={<MembersPage />} />

         <Route
            path="/memberships"
            element={<MembershipsPage />}
          />

          <Route
          path="/membership-plans"
          element={<MembershipPlansPage />}
        />

          <Route
            path="/freeze-requests"
            element={<FreezeRequestsPage />}
          />

          <Route
            path="/attendance"
            element={<AttendancePage />}
          />

          <Route
            path="/trainers"
            element={<Navigate to="/staff" replace />}
          />

          <Route
            path="/payments"
            element={<PaymentDashboard />}
          />

          <Route
            path="/payments/collect"
            element={<PaymentCollectionForm />}
          />

          <Route
            path="/payments/history"
            element={<PaymentHistory />}
          />

          <Route
            path="/reports"
            element={<ComingSoonPage title="Branch Reports" />}
          />

          <Route
            path="/staff"
            element={<StaffManagementPage />}
          />

          <Route
            path="/settings"
            element={<ComingSoonPage title="Branch Settings" />}
          />
        </Route>
      </Route>

      {/* Default Routes */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  </BrowserRouter>
);

export default App;
