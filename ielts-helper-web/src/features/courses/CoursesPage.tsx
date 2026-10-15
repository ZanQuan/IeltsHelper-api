import CheckoutPanel from './CheckoutPanel';
import LessonExerciseEditor from './LessonExerciseEditor';
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import type { CourseSummary } from '@/types';
import './courses.css';
import { useSearchParams } from 'react-router-dom';

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
  canEdit: boolean;
  lessons: CourseLesson[];
}

const MAX_VIDEO_MB = 200; // khớp với giới hạn của máy chủ (VideosController)

function uploadErrorMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { error?: string } } };
  if (e.response?.data?.error) return e.response.data.error;
  if (e.response?.status === 404 || e.response?.status === 413)
    return `Máy chủ từ chối file (có thể vượt giới hạn ${MAX_VIDEO_MB} MB).`;
  return 'Tải video lên thất bại. Hãy thử lại.';
}

const fetchCourses = () =>
  apiClient.get<{ items: CourseSummary[] }>('/api/Courses', { params: { pageSize: 100 } })
    .then((res) => res.data.items);

export default function CoursesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  const [params] = useSearchParams();

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [payError, setPayError] = useState('');
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedName, setUploadedName] = useState('');

  async function loadCourses() {
    setLoading(true);
    setCourses(await fetchCourses());
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });

    // Mở thẳng khóa học khi vào từ trang Giáo viên: /courses?courseId=...
    const id = params.get('courseId');
    if (id) {
      openCourse(id).catch(() => {
        setSelectedId(null); // id sai hoặc khóa đã bị xóa → về danh sách
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handlePay(provider: 'VnPay' | 'Momo') {
    if (!detail) return;
    setEnrolling(true);
    setPayError('');
    try {
      const res = await apiClient.post<{ paymentUrl: string }>(
        '/api/Payments/create-payment-url',
        { courseId: detail.id, provider },
      );
      window.location.href = res.data.paymentUrl; // chuyển sang trang thanh toán
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPayError(msg ?? 'Không tạo được giao dịch, vui lòng thử lại.');
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

  async function handlePickVideo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại đúng file đó lần sau
    if (!file) return;

    setLessonError('');
    if (!/\.(mp4|webm)$/i.test(file.name)) {
      setLessonError('Chỉ chấp nhận video .mp4 hoặc .webm.');
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setLessonError(`Video quá lớn (tối đa ${MAX_VIDEO_MB} MB).`);
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await apiClient.post<{ url: string }>('/api/Videos/upload', form, {
        timeout: 0, // video lớn có thể mất nhiều phút
        onUploadProgress: (ev) => {
          if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      setLessonVideoUrl(res.data.url);
      setUploadedName(file.name);
    } catch (err) {
      setLessonError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
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
      setUploadedName('');
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
          className="btn btn-ghost btn-back"
        >
          ← Quay lại danh sách
        </button>

        <h2>{detail.title}</h2>
        <div className="mb-12">
          <span className="badge badge-primary">Band {detail.targetBand}</span>
          <span className="muted ml-10">Giáo viên: {detail.teacherName}</span>
        </div>
        <p>{detail.description}</p>

        {!detail.isEnrolled ? (
          detail.price > 0 ? (
            <CheckoutPanel
              course={{
                title: detail.title,
                price: detail.price,
                teacherName: detail.teacherName,
                targetBand: detail.targetBand,
                lessonCount: detail.lessons.length,
              }}
              paying={enrolling}
              error={payError}
              onPay={handlePay}
            />
          ) : (
            <div className="card text-center">
              <p className="label">Học phí</p>
              <p className="course-price-lg">Miễn phí</p>
              <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary">
                {enrolling ? 'Đang xử lý...' : 'Ghi danh miễn phí'}
              </button>
            </div>
          )
        ) : (
          <div>
            <h3 className="mt-24">Danh sách bài học</h3>
            {detail.lessons.length === 0 && <p className="muted">Khóa học chưa có bài nào.</p>}
            {detail.lessons.map((l) => (
              <div key={l.id} className="list-item">
                <div className="row-center-10">
                  <span className="course-lesson-num">
                    {l.orderIndex}
                  </span>
                  <strong>{l.title}</strong>
                </div>
                {l.content && <p className="course-lesson-content">{l.content}</p>}
                {l.videoUrl && (
                  <p className="mb-0">
                    <a href={l.videoUrl} target="_blank" rel="noreferrer">Xem video bài học →</a>
                  </p>
                )}
                {detail.canEdit && <LessonExerciseEditor courseId={detail.id} lessonId={l.id} />}
              </div>
            ))}

            {detail.canEdit && (
              <div className="mt-20">
                <button onClick={() => setShowAddLesson((v) => !v)} className="btn btn-ghost">
                  {showAddLesson ? 'Đóng' : '+ Thêm bài học'}
                </button>
                {showAddLesson && (
                  <form onSubmit={handleAddLesson} className="card mt-12">
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
                      <input
                        className="input"
                        value={lessonVideoUrl}
                        onChange={(e) => { setLessonVideoUrl(e.target.value); setUploadedName(''); }}
                        placeholder="Dán link YouTube, hoặc chọn video từ máy ở bên dưới"
                      />
                    </div>
                    <div className="field">
                      <label className="label">Hoặc chọn video từ máy (MP4/WebM, tối đa {MAX_VIDEO_MB} MB)</label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,.mp4,.webm"
                        onChange={handlePickVideo}
                        disabled={uploading || addingLesson}
                      />
                      {uploading && (
                        <p className="muted" style={{ margin: '8px 0 0' }}>
                          Đang tải video lên... {uploadProgress}%
                          <progress value={uploadProgress} max={100} style={{ display: 'block', width: '100%', marginTop: 6 }} />
                        </p>
                      )}
                      {!uploading && uploadedName && (
                        <p className="muted" style={{ margin: '8px 0 0' }}>Đã tải lên: {uploadedName}. Link đã được điền ở ô phía trên.</p>
                      )}
                    </div>
                    {lessonError && <p className="error-text">{lessonError}</p>}
                    <button type="submit" disabled={addingLesson || uploading} className="btn btn-primary">
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
      <p className="muted mb-24">
        Các khóa học có nội dung bài giảng chi tiết, ghi danh để mở khóa toàn bộ bài học.
      </p>

      {isTeacher && (
        <div className="mb-24">
          <button onClick={() => setShowCreateForm((v) => !v)} className="btn btn-primary">
            {showCreateForm ? 'Đóng' : '+ Tạo khóa học mới'}
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreateCourse} className="card mt-12">
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
              <div className="grid-2col">
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
              <div className="row-between-gap">
                <div>
                  <strong className="fs-16">{c.title}</strong>
                  <p className="muted m-6-0">{c.description}</p>
                  <div>
                    <span className="badge badge-primary">Band {c.targetBand}</span>
                    <span className="badge badge-accent ml-6">{c.lessonCount} bài học</span>
                  </div>
                  <p className="muted course-teacher">Giáo viên: {c.teacherName}</p>
                </div>
                <span className="course-price">
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