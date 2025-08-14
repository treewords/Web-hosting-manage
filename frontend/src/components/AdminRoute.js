import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component assumes it will be rendered inside a <PrivateRoute>
// so we don't need to check for loading or basic authentication again.
// It just checks for the role.
const AdminRoute = () => {
  const { user } = useAuth();

  // If user object is available and role is 'admin', allow access.
  // Otherwise, redirect to the main dashboard.
  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
