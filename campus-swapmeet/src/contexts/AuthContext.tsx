import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  college: string;
  role: 'student' | 'superadmin';
  avatar?: string;
  phone?: string;
  year?: string;
  course?: string;
  sellerStatus?: string;
  location?: { lat: number; lng: number; address: string };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (collegeId: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  loadingUser: boolean;
}

interface SignupData {
  collegeId: string;
  password: string;
  name: string;
  collegeName: string;
  phoneNumber: string;
  year?: string;
  course?: string;
  collegeEmail: string;
  location?: { lat: number; lng: number; address: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string) => `${API_URL}${path}`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Persist user on refresh
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('token');
      setLoadingUser(true);
      
      if (token) {
        try {
          const response = await fetch(api('/auth/me'), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success) {
            setUser({
              id: data.user.id,
              email: data.user.collegeEmail || '',
              name: data.user.name,
              college: data.user.collegeName || '',
              role: data.user.role,
              phone: data.user.phoneNumber || '',
              sellerStatus: data.user.sellerStatus || '',
              location: data.user.location || undefined,
              // Add other fields as needed
            });
            setToken(token);
          } else {
            // Token is invalid
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error restoring user session:', error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoadingUser(false);
    };

    restoreUser();
  }, []); // Empty dependency array is correct here since we only want this to run once on mount

  const login = async (collegeId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId, password })
      });
      const result = await response.json();
      if (result.success) {
        setUser({
          id: result.user.id,
          email: result.user.collegeEmail || '',
          name: result.user.name,
          college: result.user.collegeName || '',
          role: result.user.role,
          phone: result.user.phoneNumber || '',
          sellerStatus: result.user.sellerStatus || '',
          location: result.user.location || undefined,
          // Add other fields as needed
        });
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(api('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setUser({
          id: result.user.id,
          email: result.user.collegeEmail || '',
          name: result.user.name,
          college: result.user.collegeName || '',
          role: result.user.role,
          phone: result.user.phoneNumber || '',
          sellerStatus: result.user.sellerStatus || '',
          location: result.user.location || undefined,
          // Add other fields as needed
        });
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};