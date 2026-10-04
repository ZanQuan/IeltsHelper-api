import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface User {
  userId: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (saved && token) {
        setUser(JSON.parse(saved));
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch {
      // Dữ liệu trong localStorage bị hỏng -> coi như chưa đăng nhập
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await apiClient.post('/api/Auth/login', { email, password });
    const loggedInUser: User = { userId: res.data.userId, name: res.data.name, role: res.data.role };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  async function register(name: string, email: string, password: string) {
    await apiClient.post('/api/Auth/register', { name, email, password });
    await login(email, password);
  }

  async function loginWithGoogle(credential: string) {
    const res = await apiClient.post('/api/Auth/google', { credential });
    const loggedInUser: User = { userId: res.data.userId, name: res.data.name, role: res.data.role };
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phai dung ben trong AuthProvider');
  return context;
}