import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { AuthContext, type User } from './AuthContext';


function readSavedUser(): User | null {
  try {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (saved && token) return JSON.parse(saved);
  } catch {

  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSavedUser);
  const navigate = useNavigate();

  function patchUser(patch: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }

  // Sau khi đăng nhập hoặc tải lại trang, lấy ảnh đại diện từ server một lần
  useEffect(() => {
    if (!user || user.avatarUrl !== undefined) return;
    let cancelled = false;
    apiClient
      .get<{ avatarUrl: string | null }>('/api/Auth/me')
      .then((res) => {
        if (!cancelled) patchUser({ avatarUrl: res.data.avatarUrl });
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function updateAvatar(avatarUrl: string | null) {
    patchUser({ avatarUrl });
  }
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
  function updateName(name: string) {
    if (!user) return;
    const updated: User = { ...user, name };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateName, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}
