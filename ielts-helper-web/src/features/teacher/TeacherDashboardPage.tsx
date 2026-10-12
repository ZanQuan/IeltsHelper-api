import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import type { ErrorLog, LessonLog, Student } from '@/types';
import './teacher.css';
import StudentTeachers from './StudentTeachers';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(isTeacher);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLogs, setStudentLogs] = useState<LessonLog[]>([]);
  const [studentErrors, setStudentErrors] = useState<ErrorLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isTeacher) return;
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

  // Học viên: xem danh sách giáo viên để kết nối qua khóa học
  if (!isTeacher) return <StudentTeachers />;

  if (selectedStudent) {
    return (
      <div>
        <button
          onClick={() => setSelectedStudent(null)}
          className="btn btn-ghost btn-back"
        >
          ← Quay lại danh sách học viên
        </button>

        <div className="teacher-student-head">
          <span className="teacher-student-avatar">
            {initials(selectedStudent.name)}
          </span>
          <div>
            <h2 className="m-0">{selectedStudent.name}</h2>
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
              <div className="mb-28">
                {studentLogs.map((log) => (
                  <div key={log.id} className="list-item">
                    <div className="row-between">
                      <div>
                        <strong>{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</strong>
                        <span className="badge badge-primary ml-10">{log.skillFocus}</span>
                      </div>
                      <span className="badge badge-success">Hiểu bài: {log.selfRating}/5</span>
                    </div>
                    <p className="m-10-0-0">{log.summary}</p>
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
                    <p className="m-10-0-0">{err.description}</p>
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
      <p className="muted mb-24">
        Bấm vào từng học viên để xem nhật ký buổi học và lỗi sai họ đã ghi lại.
      </p>

      {loadingStudents ? (
        <p className="muted">Đang tải...</p>
      ) : students.length === 0 ? (
        <div className="card">
          <p className="muted m-0">
            Chưa có học viên nào liên kết với bạn. Học viên sẽ tự được kết nối khi họ thanh toán
            một khóa học của bạn.
          </p>
        </div>
      ) : (
        <div>
          {students.map((s) => (
            <div key={s.id} className="list-item clickable" onClick={() => viewStudent(s)}>
              <div className="row-center-14">
                <span className="avatar-40">
                  {initials(s.name)}
                </span>
                <div>
                  <strong>{s.name}</strong>
                  <p className="muted m-0">{s.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}