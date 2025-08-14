import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Creăm contextul
const AuthContext = createContext(null);

// Hook custom pentru a folosi contextul mai ușor
export const useAuth = () => {
  return useContext(AuthContext);
};

// Axios instance
const api = axios.create({
  baseURL: '/api', // Folosim proxy-ul Nginx
});

// Funcție pentru a seta token-ul în headerele axios
const setAuthToken = token => {
    if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete api.defaults.headers.common['x-auth-token'];
    }
};


// Provider-ul care va încapsula aplicația
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setAuthToken(storedToken);
            try {
                const res = await api.get('/profile');
                setUser(res.data);
                setIsAuthenticated(true);
                setToken(storedToken);
            } catch (err) {
                // Token invalid sau expirat
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            }
        }
        setLoading(false);
    };

    loadUser();
  }, []);

  const register = async (email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });
    const res = await api.post('/auth/register', body, config);
    return res;
  };

  const login = async (email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });
    const res = await api.post('/auth/login', body, config);

    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setAuthToken(res.data.token);
    setIsAuthenticated(true);

    // Încărcăm datele utilizatorului după login
    const userRes = await api.get('/profile');
    setUser(userRes.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  };

  const value = {
    token,
    isAuthenticated,
    loading,
    user,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
