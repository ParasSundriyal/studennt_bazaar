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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Persist user on refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoadingUser(true);
    if (token && !user) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
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
          } else {
            setUser(null);
            localStorage.removeItem('token');
          }
          setLoadingUser(false);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('token');
          setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
    }
  }, []);

  const login = async (collegeId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
      const response = await fetch('http://localhost:5000/api/auth/signup', {
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
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, loadingUser }}>
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