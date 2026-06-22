import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

// User UI (Public)
import Home from './pages/user/Home';
import LoungeDetail from './pages/user/LoungeDetail';

// Company Intro
import CompanyIntro from './pages/CompanyIntro';

// Owner Dashboard
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TableManagement from './pages/TableManagement';
import MenuManagement from './pages/MenuManagement';
import StaffManagement from './pages/StaffManagement';
import Statistics from './pages/Statistics';
import SubscriptionInfo from './pages/SubscriptionInfo';

// Admin Dashboard
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrganizations from './pages/admin/AdminOrganizations';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('owner_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SocketProvider>
      <Layout>{children}</Layout>
    </SocketProvider>
  );
}

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* User UI — login шаардлагагүй */}
        <Route path="/" element={<Home />} />
        <Route path="/lounge/:id" element={<LoungeDetail />} />

        {/* Company Introduction / Subscription */}
        <Route path="/for-owners" element={<CompanyIntro />} />

        {/* Owner Dashboard */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoute>
              <TableManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <MenuManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionInfo />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/organizations"
          element={
            <AdminProtectedRoute>
              <AdminOrganizations />
            </AdminProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
