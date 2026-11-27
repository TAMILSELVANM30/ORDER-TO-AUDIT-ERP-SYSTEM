import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; role?: Role }) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Record<Role, string> = {
  ADMIN: 'admin@demo.com',
  SALESMAN: 'salesman.a@demo.com',
  PRODUCTION: 'production@demo.com',
  AUDITOR: 'auditor@demo.com',
  OWNER: 'owner@demo.com',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email: string, password = 'DemoPassword123!') => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { full_name: string; email: string; password: string; role?: Role }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, user: registeredUser } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setToken(access_token);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const quickSwitchRole = async (targetRole: Role) => {
    const email = DEMO_ACCOUNTS[targetRole];
    if (email) {
      await login(email, 'DemoPassword123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        quickSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
