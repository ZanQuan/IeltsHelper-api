import { useAuth } from '@/features/auth/AuthContext';
import StudentHome from './StudentHome';
import TeacherHome from './TeacherHome';

export default function HomePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  return isTeacher ? <TeacherHome /> : <StudentHome />;
}
