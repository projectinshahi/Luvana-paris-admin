'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  permissions?: string[]; // Make this optional
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setStudentUser: (data: LoginResponse) => void;
  hasPermission: (module: string) => boolean; // Add this
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect triggered');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 checkAuth function called');
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token in localStorage:', token ? 'Exists' : 'Missing');
      
      if (token) {
        console.log('🔄 Fetching user data from /me endpoint...');
        const userData = await api.get<User>('/me');
        console.log('✅ User data received:', userData);
        setUser(userData);
      } else {
        console.log('❌ No token found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ checkAuth error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      console.log('✅ checkAuth completed, setting loading to false');
      setLoading(false);
    }
  };

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('🔄 Attempting login for:', email);
    
    // Try to call the API directly to see what's happening
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
    
    const response = await fetch(`${API_URL}/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('📦 Raw response:', data);
    console.log('📦 Response status:', response.status);
    
    if (!response.ok) {
      // Show the actual backend error message
      throw new Error(data.message || data.error || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    setUser(data.user);

    console.log('✅ Login successful');
    router.push('/admin');
    return true;
    
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    throw error; // Make sure to throw it!
  }
};

  // Add this function to check permissions
  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    // Check if user has the permission
    return user.permissions?.includes(module) || false;
  };

  const setStudentUser = (data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      setStudentUser,
      hasPermission // Add this
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}