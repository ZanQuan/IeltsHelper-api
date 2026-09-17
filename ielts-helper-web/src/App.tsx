import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
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
import AssignmentsPage from './pages/AssignmentsPage';
import AdminLayout from './components/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminTestsPage from './pages/admin/AdminTestsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Đang tải...</p>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// "/" hiện trang chủ công khai nếu chưa đăng nhập, hoặc chuyển vào dashboard nếu đã đăng nhập
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p>Đang tải...</p>;
  if (user) return <Navigate to="/dashboard" />;
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Khu vực học viên/giáo viên */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/lessons" element={<LessonLogsPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/errors" element={<ErrorLogsPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/tests" element={<TestsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/speaking" element={<SpeakingPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
      </Route>

      {/* Khu vực quản trị — layout riêng, có sidebar */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/courses" element={<AdminCoursesPage />} />
        <Route path="/admin/tests" element={<AdminTestsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
