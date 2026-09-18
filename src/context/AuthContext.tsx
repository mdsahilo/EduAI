import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, displayName: string, college?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage session on mount
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setUser(savedUser);
    } else {
      // Default demo student for instant smooth testing
      const defaultUser: UserProfile = {
        uid: 'student_alex_99',
        email: 'alex.student@college.edu',
        displayName: 'Alex Chen',
        college: 'Engineering & Computer Science',
        major: 'Computer Science',
        year: '3rd Year / Semester 5',
        joinedAt: new Date().toISOString(),
      };
      StorageService.setUser(defaultUser);
      setUser(defaultUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, _pass: string) => {
    setLoading(true);
    // Simulate auth network response
    await new Promise((r) => setTimeout(r, 400));
    const loggedUser: UserProfile = {
      uid: 'user_' + btoa(email).slice(0, 10),
      email: email,
      displayName: email.split('@')[0],
      college: 'University Campus',
      major: 'Computer Science',
      year: '3rd Year',
      joinedAt: new Date().toISOString(),
    };
    StorageService.setUser(loggedUser);
    setUser(loggedUser);
    setLoading(false);
  };

  const signup = async (email: string, _pass: string, displayName: string, college?: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const newUser: UserProfile = {
      uid: 'user_' + btoa(email).slice(0, 10),
      email: email,
      displayName: displayName || email.split('@')[0],
      college: college || 'University Campus',
      major: 'Undergraduate',
      year: 'Year 2',
      joinedAt: new Date().toISOString(),
    };
    StorageService.setUser(newUser);
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    StorageService.setUser(null);
    setUser(null);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    StorageService.setUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
