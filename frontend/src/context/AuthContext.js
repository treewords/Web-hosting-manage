import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

const api = axios.create({
  baseURL: '/api',
});

const setAuthToken = token => {
    if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete api.defaults.headers.common['x-auth-token'];
    }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const finaliseLogin = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthToken(newToken);
    try {
        const userRes = await api.get('/profile');
        setUser(userRes.data);
        setIsAuthenticated(true);
    } catch (err) {
        // Handle error if profile can't be fetched after login
        logout();
    }
  };

  useEffect(() => {
    const loadUser = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            await finaliseLogin(storedToken);
        }
        setLoading(false);
    };
    loadUser();
  }, []);

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    return res;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
        // No 2FA, login is complete
        await finaliseLogin(res.data.token);
        return res.data;
    }
    // 2FA is required, return the challenge
    return res.data;
  };

  const loginWith2fa = async (challengeToken, totpToken) => {
      const res = await api.post('/auth/login/2fa', { challengeToken, totpToken });
      if (res.data.token) {
          await finaliseLogin(res.data.token);
          return res.data;
      }
      // Should not happen if API is correct, but handle it
      throw new Error("2FA login failed to return a token.");
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
    loginWith2fa,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </Auth-Provider>
  );
};
