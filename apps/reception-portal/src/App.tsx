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
                element={
                  <ComingSoon
                    title="Members"
                    description="Search and manage gym members from the reception portal."
                  />
                }
              />

             <Route
                path="/members/new"
                element={<MemberRegistrationPage />}
              />

              <Route
                path="/attendance"
                element={
                  <ComingSoon
                    title="Attendance"
                    description="QR scanning and manual check-in/check-out will be implemented in Week 7."
                  />
                }
              />

              <Route
                path="/memberships"
                element={
                  <ComingSoon
                    title="Memberships"
                    description="Membership operations and renewals will be implemented in Week 7."
                  />
                }
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
                element={
                  <ComingSoon
                    title="Payments"
                    description="Payment collection will be connected through the common payment module."
                  />
                }
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