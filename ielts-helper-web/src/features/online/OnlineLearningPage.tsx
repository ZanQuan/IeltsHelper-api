import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import logo from '@/assets/logo.png';

interface MyCourse {
  id: string; // enrollmentId
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  completedCount: number;
  completedLessonIds?: string[];
}

interface CourseSummary {
  id: string;
  lessonCount: number;
}

interface Question {
  id: string;
  prompt: string;
  options: string[];
  multiple: boolean;
}

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  content: string | null;
  videoUrl: string | null;
  exercises: Question[];
}

interface CourseDetail {
  id: string;
  title: string;
  teacherName: string;
  lessons: Lesson[];
}

interface SubmitResult {
  correct: number;
  total: number;
  results: { questionId: string; isCorrect: boolean; correctIndexes: number[] }[];
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.hostname.includes('youtube.com')) {
      id = u.searchParams.get('v') ?? (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null);
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function VideoPlayer({ url }: { url: string }) {
  const embed = toYouTubeEmbed(url);
  if (embed) {
    return (
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <iframe
          src={embed}
          title="Video bài học"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    );
  }
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return <video src={url} controls style={{ width: '100%', borderRadius: 12, background: '#000' }} />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost">
      Mở video bài học
    </a>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--primary-light)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', transition: 'width .3s' }} />
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>
        {done}/{total} bài · {pct}%
      </p>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--bg, #f7f8fc)',
  display: 'flex',
  flexDirection: 'column',
};

const topBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '12px 24px',
  background: 'var(--surface, #fff)',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
};

const bottomBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 24px',
  background: 'var(--surface, #fff)',
  borderTop: '1px solid var(--border)',
  flexShrink: 0,
};

export default function OnlineLearningPage() {
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [enrollment, setEnrollment] = useState<MyCourse | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 800);
  const [saving, setSaving] = useState(false);

  // Bài tập
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMyCourses = useCallback(async () => {
    try {
      const [mine, all] = await Promise.all([
        apiClient.get<MyCourse[]>('/api/Enrollments/my-courses'),
        apiClient.get<CourseSummary[]>('/api/Courses'),
      ]);
      setMyCourses(mine.data);
      setTotals(Object.fromEntries(all.data.map((c) => [c.id, c.lessonCount])));
    } catch {
      setError('Không tải được danh sách khóa học. Hãy thử tải lại trang.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyCourses();
  }, [loadMyCourses]);

  async function openCourse(e: MyCourse) {
    setError('');
    try {
      const res = await apiClient.get<CourseDetail>(`/api/Courses/${e.courseId}`);
      const done = e.completedLessonIds ?? [];
      setEnrollment(e);
      setDetail(res.data);
      setCompletedIds(done);
      const next = res.data.lessons.find((l) => !done.includes(l.id)) ?? res.data.lessons[0];
      setActiveLessonId(next?.id ?? null);
    } catch {
      setError('Không mở được khóa học này.');
    }
  }

  async function backToList() {
    setEnrollment(null);
    setDetail(null);
    setActiveLessonId(null);
    setExerciseOpen(false);
    setLoading(true);
    await loadMyCourses();
  }

  function selectLesson(id: string) {
    setActiveLessonId(id);
    setExerciseOpen(false);
    setResult(null);
    setAnswers({});
  }

  // Ghi nhận hoàn thành lên server (không tự chuyển bài)
  async function markComplete(lessonId: string) {
    if (!enrollment || completedIds.includes(lessonId)) return;
    try {
      await apiClient.post(`/api/Enrollments/${enrollment.id}/lessons/${lessonId}/complete`);
      setCompletedIds((prev) => [...prev, lessonId]);
    } catch {
      setError('Không lưu được tiến độ, hãy thử lại.');
    }
  }

  async function completeAndNext(lessonId: string) {
    setSaving(true);
    await markComplete(lessonId);
    setSaving(false);
    if (detail) {
      const idx = detail.lessons.findIndex((l) => l.id === lessonId);
      const next = detail.lessons[idx + 1];
      if (next) selectLesson(next.id);
    }
  }

  function startExercise() {
    setAnswers({});
    setResult(null);
    setExerciseOpen(true);
  }

  function pick(q: Question, index: number) {
    if (result) return;
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.multiple) {
        return { ...prev, [q.id]: cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index] };
      }
      return { ...prev, [q.id]: [index] };
    });
  }

  async function submitExercise(lesson: Lesson) {
    if (!enrollment) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post<SubmitResult>(
        `/api/Courses/${enrollment.courseId}/lessons/${lesson.id}/submit`,
        { answers },
      );
      setResult(res.data);
      await markComplete(lesson.id);
    } catch {
      setError('Không nộp được bài, hãy thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="muted">Đang tải...</p>;

  // ================= Màn hình học toàn màn hình =================
  if (enrollment && detail) {
    const lessons = detail.lessons;
    const lesson = lessons.find((l) => l.id === activeLessonId) ?? null;
    const idx = lesson ? lessons.findIndex((l) => l.id === lesson.id) : -1;
    const hasExercise = !!lesson && lesson.exercises.length > 0;
    const lessonDone = !!lesson && completedIds.includes(lesson.id);

    // ----- Màn hình làm bài tập -----
    if (exerciseOpen && lesson) {
      const answeredAll = lesson.exercises.every((q) => (answers[q.id] ?? []).length > 0);
      return (
        <div style={{ ...overlay, zIndex: 120 }}>
          <div style={{ ...topBar, justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }} onClick={() => setExerciseOpen(false)}>
              ✕ Thoát
            </button>
            <strong style={{ textAlign: 'center', flex: 1 }}>{lesson.title}</strong>
            <span style={{ width: 90 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              {result && (
                <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
                  <p className="label" style={{ margin: 0 }}>Kết quả</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                    {result.correct}/{result.total} câu đúng
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    {result.correct === result.total ? 'Làm tốt lắm!' : 'Xem lại các câu sai bên dưới rồi làm lại nhé.'}
                  </p>
                </div>
              )}
              {error && <p className="error-text">{error}</p>}

              {lesson.exercises.map((q, qi) => {
                const picked = answers[q.id] ?? [];
                const r = result?.results.find((x) => x.questionId === q.id);
                return (
                  <div key={q.id} className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                      <span
                        style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 13,
                        }}
                      >
                        {qi + 1}
                      </span>
                      <div>
                        <strong>{q.prompt}</strong>
                        {q.multiple && <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>Chọn nhiều đáp án</p>}
                      </div>
                    </div>

                    {q.options.map((opt, oi) => {
                      const isPicked = picked.includes(oi);
                      const isCorrect = !!r && r.correctIndexes.includes(oi);
                      const isWrongPick = !!r && isPicked && !isCorrect;
                      let border = 'var(--border)';
                      let bg = 'transparent';
                      if (r) {
                        if (isCorrect) { border = '#22a55b'; bg = 'rgba(34,165,91,.08)'; }
                        else if (isWrongPick) { border = '#e5484d'; bg = 'rgba(229,72,77,.08)'; }
                      } else if (isPicked) {
                        border = 'var(--primary)'; bg = 'var(--primary-light)';
                      }
                      return (
                        <label
                          key={oi}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8,
                            border: `1px solid ${border}`, background: bg, borderRadius: 10,
                            cursor: result ? 'default' : 'pointer',
                          }}
                        >
                          <input
                            type={q.multiple ? 'checkbox' : 'radio'}
                            name={q.id}
                            checked={isPicked}
                            disabled={!!result}
                            onChange={() => pick(q, oi)}
                          />
                          <span
                            style={{
                              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 700,
                            }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={bottomBar}>
            <button className="btn btn-ghost" onClick={() => setExerciseOpen(false)}>
              Danh sách bài học
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {result ? (
                <>
                  <button className="btn btn-ghost" onClick={startExercise}>Làm lại</button>
                  {idx < lessons.length - 1 && (
                    <button className="btn btn-primary" onClick={() => selectLesson(lessons[idx + 1].id)}>
                      Bài tiếp theo
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={submitting || !answeredAll}
                  onClick={() => submitExercise(lesson)}
                >
                  {submitting ? 'Đang chấm...' : 'Gửi bài'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ----- Màn hình xem bài học -----
    return (
      <div style={{ ...overlay, zIndex: 100 }}>
        <div style={topBar}>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 14 }} onClick={backToList} aria-label="Quay lại khóa học của tôi">
            ←
          </button>
          <img src={logo} alt="Whale English" style={{ height: 32, width: 32, objectFit: 'contain' }} />
          <span style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <strong style={{ fontSize: 16 }}>{detail.title}</strong>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {sidebarOpen && (
            <aside
              style={{
                width: 340, flexShrink: 0, overflowY: 'auto', padding: 20,
                background: 'var(--surface, #fff)', borderRight: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ border: 0, background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
              >
                ✕ Ẩn danh sách bài học
              </button>
              <h3 style={{ margin: '0 0 4px' }}>{detail.title}</h3>
              <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>Giáo viên: {detail.teacherName}</p>
              <div style={{ marginBottom: 16 }}>
                <ProgressBar done={completedIds.length} total={lessons.length} />
              </div>

              {lessons.map((l) => {
                const done = completedIds.includes(l.id);
                const active = l.id === activeLessonId;
                return (
                  <button
                    key={l.id}
                    onClick={() => selectLesson(l.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left',
                      padding: '12px', marginBottom: 6, border: 0, borderRadius: 12, cursor: 'pointer',
                      background: active ? 'var(--primary-light)' : 'transparent',
                      color: active ? 'var(--primary)' : 'inherit',
                    }}
                  >
                    <span
                      style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        background: done ? 'var(--primary)' : 'var(--primary-light)',
                        color: done ? 'white' : 'var(--primary)',
                      }}
                    >
                      {done ? '✓' : l.orderIndex}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>
                      {l.title}
                      <span className="muted" style={{ display: 'block', fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                        {l.videoUrl ? 'Video' : 'Bài đọc'}
                        {l.exercises.length > 0 ? ` · ${l.exercises.length} câu hỏi` : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </aside>
          )}

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {!sidebarOpen && (
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setSidebarOpen(true)}>
                        ☰ Danh sách bài học
                      </button>
                    )}
                    <span className="muted" style={{ fontSize: 14 }}>
                      {detail.title}
                      {lesson ? ` › Bài ${lesson.orderIndex}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} disabled={idx <= 0} onClick={() => selectLesson(lessons[idx - 1].id)}>
                      ← Bài trước
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} disabled={idx === -1 || idx >= lessons.length - 1} onClick={() => selectLesson(lessons[idx + 1].id)}>
                      Bài tiếp →
                    </button>
                  </div>
                </div>

                {error && <p className="error-text">{error}</p>}

                {!lesson ? (
                  <p className="muted">Khóa học chưa có bài nào. Giáo viên sẽ sớm cập nhật.</p>
                ) : (
                  <>
                    <h2 style={{ marginTop: 0 }}>{lesson.title}</h2>
                    {lesson.videoUrl && (
                      <div style={{ marginBottom: 20 }}>
                        <VideoPlayer url={lesson.videoUrl} />
                      </div>
                    )}
                    {lesson.content && (
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, maxWidth: 780 }}>{lesson.content}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {lesson && (
              <div style={{ ...bottomBar, justifyContent: 'center' }}>
                {hasExercise ? (
                  <button className="btn btn-primary" onClick={startExercise}>
                    {lessonDone ? 'Làm lại bài tập' : 'Bắt đầu làm bài tập'}
                  </button>
                ) : lessonDone ? (
                  <>
                    <span className="badge badge-primary">Đã hoàn thành</span>
                    {idx < lessons.length - 1 && (
                      <button className="btn btn-primary" onClick={() => selectLesson(lessons[idx + 1].id)}>
                        Bài tiếp theo
                      </button>
                    )}
                  </>
                ) : (
                  <button className="btn btn-primary" disabled={saving} onClick={() => completeAndNext(lesson.id)}>
                    {saving ? 'Đang lưu...' : 'Hoàn thành bài học'}
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ================= Danh sách khóa đã ghi danh =================
  return (
    <div>
      <h2>Bài giảng video</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Tiếp tục các khóa bạn đã ghi danh. Tiến độ được lưu sau mỗi bài hoàn thành.
      </p>

      {error && <p className="error-text">{error}</p>}

      {myCourses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginTop: 0 }}>Bạn chưa ghi danh khóa học nào.</p>
          <Link to="/courses" className="btn btn-primary">Xem danh sách khóa học</Link>
        </div>
      ) : (
        <div>
          {myCourses.map((c) => (
            <div key={c.id} className="list-item clickable" onClick={() => openCourse(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 16 }}>{c.courseTitle}</strong>
                  <p className="muted" style={{ fontSize: 13, margin: '4px 0 10px' }}>
                    Ghi danh ngày {new Date(c.enrolledAt).toLocaleDateString('vi-VN')}
                  </p>
                  <div style={{ maxWidth: 360 }}>
                    <ProgressBar done={c.completedCount} total={totals[c.courseId] ?? 0} />
                  </div>
                </div>
                <span className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  {c.completedCount > 0 ? 'Học tiếp' : 'Bắt đầu học'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}