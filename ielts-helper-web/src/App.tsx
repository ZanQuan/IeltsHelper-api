import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import LessonLogsPage from './pages/LessonLogsPage';
import Layout from './components/Layout';
import VocabularyPage from './pages/VocabularyPage';
import ErrorLogsPage from './pages/ErrorLogsPage';
import WritingPage from './pages/WritingPage';
import TestsPage from './pages/TestsPage';
import CoursesPage from './pages/CoursesPage';
import SpeakingPage from './pages/SpeakingPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lessons" element={<LessonLogsPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/errors" element={<ErrorLogsPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/courses" element={<CoursesPage />} /> 
        <Route path="/speaking" element={<SpeakingPage />} />     
        <Route path="/teacher" element={<TeacherDashboardPage />} />
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