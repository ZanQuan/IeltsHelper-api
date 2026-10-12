import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import type { CourseSummary } from '@/types';

interface TeacherItem {
  id: string; name: string; bio: string | null;
  courseCount: number; isLinked: boolean;
}

export default function StudentTeachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selected, setSelected] = useState<TeacherItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<TeacherItem[]>('/api/TeacherLinks/teachers').then((res) => {
      setTeachers(res.data);
      setLoading(false);
    });
  }, []);

  async function openTeacher(t: TeacherItem) {
  setSelected(t);
  const res = await apiClient.get<{ items: CourseSummary[] }>('/api/Courses', {
    params: { pageSize: 100 },
  });
  setCourses(res.data.items.filter((c) => c.teacherId === t.id));
}

  if (selected) {
    return (
      <div>
        <button className="btn btn-ghost btn-back" onClick={() => setSelected(null)}>
          ← Quay lại danh sách giáo viên
        </button>
        <h2>Khóa học của {selected.name}</h2>
        <p className="muted mb-24">Thanh toán một khóa học để kết nối với giáo viên này.</p>
        {courses.length === 0 ? (
          <p className="muted">Giáo viên này chưa có khóa học nào.</p>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="list-item clickable"
                 onClick={() => navigate(`/courses?courseId=${c.id}`)}>
              <strong>{c.title}</strong>
              <p className="muted">{c.description}</p>
              <span className="badge badge-primary">Band {c.targetBand}</span>
              <span className="badge badge-accent ml-6">{c.lessonCount} bài học</span>
              <strong className="ml-10">{c.price.toLocaleString('vi-VN')} đ</strong>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Giáo viên</h2>
      <p className="muted mb-24">Chọn giáo viên và đăng ký khóa học để được kết nối.</p>
      {loading ? <p className="muted">Đang tải...</p> :
        teachers.length === 0 ? <p className="muted">Chưa có giáo viên nào.</p> :
        teachers.map((t) => (
          <div key={t.id} className="list-item clickable" onClick={() => openTeacher(t)}>
            <strong>{t.name}</strong>
            {t.isLinked && <span className="badge badge-success ml-10">Đã kết nối</span>}
            {t.bio && <p className="muted m-6-0">{t.bio}</p>}
            <span className="badge badge-accent">{t.courseCount} khóa học</span>
          </div>
        ))}
    </div>
  );
}