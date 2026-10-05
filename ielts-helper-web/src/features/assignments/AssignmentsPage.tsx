import { useAuth } from '@/features/auth/useAuth';
import StudentAssignments from './StudentAssignments';
import TeacherAssignments from './TeacherAssignments';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  return isTeacher ? <TeacherAssignments /> : <StudentAssignments />;
}
