import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LessonLogsPage from './pages/LessonLogsPage';
import Layout from './components/Layout';
import VocabularyPage from './pages/VocabularyPage';
import ErrorLogsPage from './pages/ErrorLogsPage';
import WritingPage from './pages/WritingPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Đang tải...</p>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lessons" element={<LessonLogsPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/errors" element={<ErrorLogsPage />} />
        <Route path="/writing" element={<WritingPage />} />      
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}