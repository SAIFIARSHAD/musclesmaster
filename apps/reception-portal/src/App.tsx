import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import MemberRegistrationPage from './pages/MemberRegistrationPage';
import MembersPage from './pages/MembersPage';
import MemberDetailsPage from './pages/MemberDetailsPage';
import AttendancePage from './pages/AttendancePage';
import MembershipsPage from './pages/MembershipsPage';
import { PaymentDashboard } from '@repo/payment-module';
import { PaymentCollectionForm } from '@repo/payment-module';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ComingSoon from './pages/ComingSoon';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Reception routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route
                path="/members"
                element={<MembersPage />}
              />

              <Route
                path="/members/:memberId"
                element={<MemberDetailsPage />}
              />

             <Route
                path="/members/new"
                element={<MemberRegistrationPage />}
              />

            <Route
              path="/attendance"
              element={<AttendancePage />}
            />

              <Route
                path="/memberships"
                element={<MembershipsPage />}
              />

              <Route
                path="/leads"
                element={
                  <ComingSoon
                    title="Leads & Inquiries"
                    description="Reception CRM and follow-up management will be implemented in Week 7."
                  />
                }
              />

              <Route
                path="/payments"
                element={<PaymentDashboard />}
              />
              <Route
                path="/payments/collect"
                element={<PaymentCollectionForm />}
              />


            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;