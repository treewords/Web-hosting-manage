import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Importăm paginile (le vom crea imediat)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DomainsPage from './pages/DomainsPage';
import MysqlPage from './pages/MysqlPage';
import FileManagerPage from './pages/FileManagerPage';

// Importăm componentele de layout și de rutare protejată
import PrivateRoute from './components/PrivateRoute';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Creăm o temă de bază
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Rute publice cu layout de autentificare */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Rute private cu layout de dashboard */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/domains" element={<DomainsPage />} />
                  <Route path="/mysql" element={<MysqlPage />} />
                  <Route path="/files" element={<FileManagerPage />} />
                  {/* Aici se vor adăuga alte rute de dashboard, ex: /databases etc. */}
              </Route>
            </Route>

          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
