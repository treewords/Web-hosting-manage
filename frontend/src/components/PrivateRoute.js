import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // TODO: Înlocuiește asta cu o verificare mai robustă (ex: din AuthContext)
  const isAuthenticated = !!localStorage.getItem('token');

  // Dacă utilizatorul este autentificat, randăm componenta copil (ex: DashboardLayout)
  // Altfel, îl redirecționăm către pagina de login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
