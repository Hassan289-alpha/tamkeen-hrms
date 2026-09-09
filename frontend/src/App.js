import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeDashboard from './components/EmployeeDashboard';
import HRDashboard from './components/HRDashboard';
import CEODashboard from './components/CEODashboard';
import Login from './components/Login';

// Helper to decode JWT token payload on frontend
export const getAuthData = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) return null;

    // Decode JWT payload
    const base64Url = token.split('.')[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const user = userStr ? JSON.parse(userStr) : payload;
      return { token, payload, user, role: payload.role || user.role };
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      return { token, payload: user, user, role: user.role };
    }
    return null;
  } catch (e) {
    console.error('JWT Parse error:', e);
    return null;
  }
};

// Protected Route Component based on Role
const ProtectedRoute = ({ allowedRoles, children }) => {
  const auth = getAuthData();

  if (!auth || !auth.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    if (auth.role === 'CEO') return <Navigate to="/ceo" replace />;
    if (auth.role === 'HR' || auth.role === 'Manager') return <Navigate to="/hr" replace />;
    return <Navigate to="/employee" replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const auth = getAuthData();
  if (auth && auth.token) {
    if (auth.role === 'CEO') return <Navigate to="/ceo" replace />;
    if (auth.role === 'HR' || auth.role === 'Manager') return <Navigate to="/hr" replace />;
    return <Navigate to="/employee" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <Routes>
          {/* Automatically redirect root to the Login page */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['Employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['HR', 'Manager']}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo"
            element={
              <ProtectedRoute allowedRoles={['CEO']}>
                <CEODashboard />
              </ProtectedRoute>
            }
          />
          {/* Catch all unknown routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;