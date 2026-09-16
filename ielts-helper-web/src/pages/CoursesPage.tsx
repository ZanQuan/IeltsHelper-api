import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface CourseSummary {
  id: string;
  title: string;
  description: string;
  targetBand: string;
  price: number;
  teacherName: string;
  lessonCount: number;
}

interface CourseLesson {
  id: string;
  title: string;
  orderIndex: number;
  content: string | null;
  videoUrl: string | null;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  targetBand: string;
  price: number;
  teacherName: string;
  isEnrolled: boolean;
  lessons: CourseLesson[];
}

export default function CoursesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetBand, setTargetBand] = useState('6.0-7.0');
  const [price, setPrice] = useState(0);
  const [creating, setCreating] = useState(false);

  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonError, setLessonError] = useState('');

  async function loadCourses() {
    setLoading(true);
    const res = await apiClient.get<CourseSummary[]>('/api/Courses');
    setCourses(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function openCourse(id: string) {
    setSelectedId(id);
    const res = await apiClient.get<CourseDetail>(`/api/Courses/${id}`);
    setDetail(res.data);
  }

  async function handleEnroll() {
    if (!detail) return;
    setEnrolling(true);
    try {
      await apiClient.post('/api/Enrollments', { courseId: detail.id });
      await openCourse(detail.id);
    } finally {
      setEnrolling(false);
    }
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post('/api/Courses', { title, description, targetBand, price });
      setTitle('');
      setDescription('');
      setPrice(0);
      setShowCreateForm(false);
      await loadCourses();
    } finally {
      setCreating(false);
    }
  }

  async function handleAddLesson(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setAddingLesson(true);
    setLessonError('');
    try {
      await apiClient.post(`/api/Courses/${detail.id}/lessons`, {
        title: lessonTitle,
        content: lessonContent,
        videoUrl: lessonVideoUrl || null,
      });
      setLessonTitle('');
      setLessonContent('');
      setLessonVideoUrl('');
      setShowAddLesson(false);
      await openCourse(detail.id);
    } catch {
      setLessonError('Không thêm được — có thể bạn không phải giáo viên tạo khóa học này.');
    } finally {
      setAddingLesson(false);
    }
  }

  if (loading) return <p className="muted">Đang tải...</p>;

  if (selectedId && detail) {
    return (
      <div>
        <button
          onClick={() => { setSelectedId(null); setDetail(null); }}
          className="btn btn-ghost"
          style={{ padding: '8px 16px', fontSize: 14, marginBottom: 16 }}
        >
          ← Quay lại danh sách
        </button>

        <h2>{detail.title}</h2>
        <div style={{ marginBottom: 12 }}>
          <span className="badge badge-primary">Band {detail.targetBand}</span>
          <span className="muted" style={{ marginLeft: 10 }}>Giáo viên: {detail.teacherName}</span>
        </div>
        <p>{detail.description}</p>

        {!detail.isEnrolled ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">Học phí</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '0 0 16px' }}>
              {detail.price.toLocaleString('vi-VN')} đ
            </p>
            <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary">
              {enrolling ? 'Đang xử lý...' : 'Ghi danh học ngay'}
            </button>
            <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Thanh toán VNPay đang tạm dừng — ghi danh miễn phí để test.
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ marginTop: 24 }}>Danh sách bài học</h3>
            {detail.lessons.length === 0 && <p className="muted">Khóa học chưa có bài nào.</p>}
            {detail.lessons.map((l) => (
              <div key={l.id} className="list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {l.orderIndex}
                  </span>
                  <strong>{l.title}</strong>
                </div>
                {l.content && <p style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{l.content}</p>}
                {l.videoUrl && (
                  <p style={{ marginBottom: 0 }}>
                    <a href={l.videoUrl} target="_blank" rel="noreferrer">Xem video bài học →</a>
                  </p>
                )}
              </div>
            ))}

            {isTeacher && (
              <div style={{ marginTop: 20 }}>
                <button onClick={() => setShowAddLesson((v) => !v)} className="btn btn-ghost">
                  {showAddLesson ? 'Đóng' : '+ Thêm bài học'}
                </button>
                {showAddLesson && (
                  <form onSubmit={handleAddLesson} className="card" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label className="label">Tên bài học</label>
                      <input className="input" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="label">Nội dung</label>
                      <textarea
                        className="input"
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        required
                        rows={4}
                      />
                    </div>
                    <div className="field">
                      <label className="label">Link video (không bắt buộc)</label>
                      <input className="input" value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} />
                    </div>
                    {lessonError && <p className="error-text">{lessonError}</p>}
                    <button type="submit" disabled={addingLesson} className="btn btn-primary">
                      {addingLesson ? 'Đang thêm...' : 'Thêm bài học'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Khóa học</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Các khóa học có nội dung bài giảng chi tiết, ghi danh để mở khóa toàn bộ bài học.
      </p>

      {isTeacher && (
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setShowCreateForm((v) => !v)} className="btn btn-primary">
            {showCreateForm ? 'Đóng' : '+ Tạo khóa học mới'}
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreateCourse} className="card" style={{ marginTop: 12 }}>
              <div className="field">
                <label className="label">Tên khóa học</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="field">
                <label className="label">Mô tả</label>
                <textarea
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field">
                  <label className="label">Band mục tiêu</label>
                  <input className="input" value={targetBand} onChange={(e) => setTargetBand(e.target.value)} placeholder="vd: 6.5-7.5" />
                </div>
                <div className="field">
                  <label className="label">Giá (đ)</label>
                  <input className="input" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
              </div>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Đang tạo...' : 'Tạo khóa học'}
              </button>
            </form>
          )}
        </div>
      )}

      {courses.length === 0 ? (
        <p className="muted">Chưa có khóa học nào.</p>
      ) : (
        <div>
          {courses.map((c) => (
            <div key={c.id} className="list-item clickable" onClick={() => openCourse(c.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{c.title}</strong>
                  <p className="muted" style={{ margin: '6px 0' }}>{c.description}</p>
                  <div>
                    <span className="badge badge-primary">Band {c.targetBand}</span>
                    <span className="badge badge-accent" style={{ marginLeft: 6 }}>{c.lessonCount} bài học</span>
                  </div>
                  <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>Giáo viên: {c.teacherName}</p>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                  {c.price.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
