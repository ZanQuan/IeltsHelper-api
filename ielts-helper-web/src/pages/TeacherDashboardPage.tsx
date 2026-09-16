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
  const [linkOk, setLinkOk] = useState(false);

  async function handleAddTeacher(e: FormEvent) {
    e.preventDefault();
    setLinking(true);
    setLinkMessage('');
    try {
      const res = await apiClient.post('/api/TeacherLinks/add-teacher', { teacherEmail });
      setLinkMessage(res.data.message);
      setLinkOk(true);
      setTeacherEmail('');
    } catch (err) {
      setLinkOk(false);
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

  function initials(name: string) {
    return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  }

  if (!isTeacher) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2>Liên kết giáo viên</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Thêm giáo viên đang dạy bạn để họ xem được nhật ký buổi học và lỗi sai của bạn.
        </p>
        <form onSubmit={handleAddTeacher} className="card">
          <div className="field">
            <label className="label">Email giáo viên</label>
            <input
              className="input"
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              required
              placeholder="giaovien@example.com"
            />
          </div>
          <button type="submit" disabled={linking} className="btn btn-primary">
            {linking ? 'Đang liên kết...' : 'Thêm giáo viên'}
          </button>
          {linkMessage && (
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: 14,
                color: linkOk ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {linkMessage}
            </p>
          )}
        </form>
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div>
        <button
          onClick={() => setSelectedStudent(null)}
          className="btn btn-ghost"
          style={{ padding: '8px 16px', fontSize: 14, marginBottom: 16 }}
        >
          ← Quay lại danh sách học viên
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            {initials(selectedStudent.name)}
          </span>
          <div>
            <h2 style={{ margin: 0 }}>{selectedStudent.name}</h2>
            <span className="muted">{selectedStudent.email}</span>
          </div>
        </div>

        {loadingDetail ? (
          <p className="muted">Đang tải...</p>
        ) : (
          <>
            <h3>Buổi học gần đây</h3>
            {studentLogs.length === 0 ? (
              <p className="muted">Chưa có buổi học nào.</p>
            ) : (
              <div style={{ marginBottom: 28 }}>
                {studentLogs.map((log) => (
                  <div key={log.id} className="list-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong>{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</strong>
                        <span className="badge badge-primary" style={{ marginLeft: 10 }}>{log.skillFocus}</span>
                      </div>
                      <span className="badge badge-success">Hiểu bài: {log.selfRating}/5</span>
                    </div>
                    <p style={{ margin: '10px 0 0' }}>{log.summary}</p>
                  </div>
                ))}
              </div>
            )}

            <h3>Lỗi sai thường gặp</h3>
            {studentErrors.length === 0 ? (
              <p className="muted">Chưa có lỗi sai nào được ghi lại.</p>
            ) : (
              <div>
                {studentErrors.map((err) => (
                  <div key={err.id} className="list-item">
                    <span className="badge badge-accent">{err.errorType}</span>
                    <p style={{ margin: '10px 0 0' }}>{err.description}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Học viên của tôi</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Bấm vào từng học viên để xem nhật ký buổi học và lỗi sai họ đã ghi lại.
      </p>

      {loadingStudents ? (
        <p className="muted">Đang tải...</p>
      ) : students.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Chưa có học viên nào liên kết với bạn. Bảo học viên vào mục "Giáo viên" trong tài khoản của họ và nhập
            email của bạn.
          </p>
        </div>
      ) : (
        <div>
          {students.map((s) => (
            <div key={s.id} className="list-item clickable" onClick={() => viewStudent(s)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {initials(s.name)}
                </span>
                <div>
                  <strong>{s.name}</strong>
                  <p className="muted" style={{ margin: 0 }}>{s.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
