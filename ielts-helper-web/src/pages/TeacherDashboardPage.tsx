import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface LessonLog {
  id: string;
  lessonDate: string;
  skillFocus: string;
  summary: string;
  selfRating: number;
}

interface ErrorLog {
  id: string;
  errorType: string;
  description: string;
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  const [teacherEmail, setTeacherEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');

  async function handleAddTeacher(e: FormEvent) {
    e.preventDefault();
    setLinking(true);
    setLinkMessage('');
    try {
      const res = await apiClient.post('/api/TeacherLinks/add-teacher', { teacherEmail });
      setLinkMessage(res.data.message);
      setTeacherEmail('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setLinkMessage(err.response?.data?.error || 'Liên kết thất bại.');
      } else {
        setLinkMessage('Liên kết thất bại.');
      }
    } finally {
      setLinking(false);
    }
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLogs, setStudentLogs] = useState<LessonLog[]>([]);
  const [studentErrors, setStudentErrors] = useState<ErrorLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isTeacher) return;
    setLoadingStudents(true);
    apiClient.get<Student[]>('/api/TeacherLinks/my-students').then((res) => {
      setStudents(res.data);
      setLoadingStudents(false);
    });
  }, [isTeacher]);

  async function viewStudent(student: Student) {
    setSelectedStudent(student);
    setLoadingDetail(true);
    const [logsRes, errorsRes] = await Promise.all([
      apiClient.get<LessonLog[]>(`/api/LessonLogs?studentId=${student.id}`),
      apiClient.get<ErrorLog[]>(`/api/ErrorLogs?studentId=${student.id}`),
    ]);
    setStudentLogs(logsRes.data);
    setStudentErrors(errorsRes.data);
    setLoadingDetail(false);
  }

  if (!isTeacher) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2>Liên kết giáo viên</h2>
        <p style={{ color: '#666' }}>Thêm giáo viên đang dạy bạn để họ có thể xem tiến độ học của bạn.</p>
        <form onSubmit={handleAddTeacher} style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <label>Email giáo viên</label><br />
          <input
            type="email"
            value={teacherEmail}
            onChange={(e) => setTeacherEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
          <button type="submit" disabled={linking} style={{ marginTop: 12 }}>
            {linking ? 'Đang liên kết...' : 'Thêm giáo viên'}
          </button>
        </form>
        {linkMessage && <p style={{ marginTop: 12 }}>{linkMessage}</p>}
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelectedStudent(null)}>← Quay lại danh sách học viên</button>
        <h2>{selectedStudent.name}</h2>
        <p style={{ color: '#666' }}>{selectedStudent.email}</p>

        {loadingDetail ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <h3>Buổi học gần đây</h3>
            {studentLogs.length === 0 ? (
              <p>Chưa có buổi học nào.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {studentLogs.map((log) => (
                  <li key={log.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                    <strong>{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</strong> — {log.skillFocus} (đánh giá: {log.selfRating}/5)
                    <p style={{ margin: '4px 0' }}>{log.summary}</p>
                  </li>
                ))}
              </ul>
            )}

            <h3>Lỗi sai thường gặp</h3>
            {studentErrors.length === 0 ? (
              <p>Chưa có lỗi sai nào được ghi lại.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {studentErrors.map((err) => (
                  <li key={err.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                    <strong>{err.errorType}</strong>
                    <p style={{ margin: '4px 0' }}>{err.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Học viên của tôi</h2>
      {loadingStudents ? (
        <p>Đang tải...</p>
      ) : students.length === 0 ? (
        <p>Chưa có học viên nào liên kết với bạn. Bảo học viên vào mục "Giáo viên" trong tài khoản của họ để thêm email của bạn.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {students.map((s) => (
            <li
              key={s.id}
              style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => viewStudent(s)}
            >
              <strong>{s.name}</strong>
              <p style={{ margin: '4px 0', color: '#666' }}>{s.email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}