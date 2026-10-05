import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/useAuth';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import LandingPage from '@/features/landing/LandingPage';
import HomePage from '@/features/dashboard/HomePage';
import LessonLogsPage from '@/features/lessons/LessonLogsPage';
import Layout from '@/components/layout/Layout';
import VocabularyPage from '@/features/vocabulary/VocabularyPage';
import ErrorLogsPage from '@/features/errors/ErrorLogsPage';
import WritingPage from '@/features/writing/WritingPage';
import TestsPage from '@/features/tests/TestsPage';
import CoursesPage from '@/features/courses/CoursesPage';
import SpeakingPage from '@/features/speaking/SpeakingPage';
import TeacherDashboardPage from '@/features/teacher/TeacherDashboardPage';
import AssignmentsPage from '@/features/assignments/AssignmentsPage';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminOverviewPage from '@/features/admin/AdminOverviewPage';
import AdminUsersPage from '@/features/admin/AdminUsersPage';
import AdminCoursesPage from '@/features/admin/AdminCoursesPage';
import AdminTestsPage from '@/features/admin/AdminTestsPage';
import SettingsPage from '@/features/settings/SettingsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function RootRoute() {
  const { user } = useAuth();
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
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Khu vực quản trị - layout riêng, có sidebar */}
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
      <BrowserRouter useTransitions={false}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}