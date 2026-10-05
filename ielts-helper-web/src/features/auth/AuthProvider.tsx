import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { AuthContext, type User } from './AuthContext';


// Đọc phiên đăng nhập đã lưu ngay khi khởi tạo (không cần useEffect, không bị nháy trang "Đang tải")
function readSavedUser(): User | null {
  try {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved && token) return JSON.parse(saved);
  } catch {
    // Dữ liệu trong localStorage bị hỏng -> coi như chưa đăng nhập
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSavedUser);
  const navigate = useNavigate();

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
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
