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

  if (loading) return <p>Đang tải...</p>;

  if (selectedId && detail) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => { setSelectedId(null); setDetail(null); }}>← Quay lại danh sách</button>
        <h2>{detail.title}</h2>
        <p style={{ color: '#666' }}>Giáo viên: {detail.teacherName} · Band mục tiêu: {detail.targetBand}</p>
        <p>{detail.description}</p>

        {!detail.isEnrolled ? (
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <p>Giá: {detail.price.toLocaleString('vi-VN')} đ</p>
            <button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Đang xử lý...' : 'Ghi danh học ngay'}
            </button>
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              (Thanh toán VNPay đang tạm dừng — ghi danh miễn phí để test.)
            </p>
          </div>
        ) : (
          <div>
            <h3>Danh sách bài học</h3>
            {detail.lessons.map((l) => (
              <div key={l.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                <strong>Bài {l.orderIndex}: {l.title}</strong>
                {l.content && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{l.content}</p>}
                {l.videoUrl && <p><a href={l.videoUrl} target="_blank" rel="noreferrer">Xem video bài học</a></p>}
              </div>
            ))}

            {isTeacher && (
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setShowAddLesson((v) => !v)}>
                  {showAddLesson ? 'Đóng' : '+ Thêm bài học'}
                </button>
                {showAddLesson && (
                  <form onSubmit={handleAddLesson} style={{ marginTop: 8, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
                    <div>
                      <label>Tên bài học</label><br />
                      <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label>Nội dung</label><br />
                      <textarea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} required style={{ width: '100%' }} rows={4} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label>Link video (không bắt buộc)</label><br />
                      <input value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    {lessonError && <p style={{ color: 'red' }}>{lessonError}</p>}
                    <button type="submit" disabled={addingLesson} style={{ marginTop: 8 }}>
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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Khóa học</h2>

      {isTeacher && (
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? 'Đóng' : '+ Tạo khóa học mới'}
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreateCourse} style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
              <div>
                <label>Tên khóa học</label><br />
                <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%' }} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Mô tả</label><br />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%' }} rows={2} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Band mục tiêu</label><br />
                <input value={targetBand} onChange={(e) => setTargetBand(e.target.value)} placeholder="vd: 6.5-7.5" />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Giá (đ)</label><br />
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <button type="submit" disabled={creating} style={{ marginTop: 12 }}>
                {creating ? 'Đang tạo...' : 'Tạo khóa học'}
              </button>
            </form>
          )}
        </div>
      )}

      {courses.length === 0 ? (
        <p>Chưa có khóa học nào.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {courses.map((c) => (
            <li
              key={c.id}
              style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => openCourse(c.id)}
            >
              <strong>{c.title}</strong>
              <p style={{ margin: '4px 0', color: '#666' }}>{c.description}</p>
              <p style={{ fontSize: 13, color: '#999' }}>
                Giáo viên: {c.teacherName} · {c.lessonCount} bài học · {c.price.toLocaleString('vi-VN')} đ
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}