import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface LessonLog {
  id: string;
  lessonDate: string;
  skillFocus: string;
  summary: string;
  selfRating: number;
}

interface Vocabulary {
  id: string;
}

interface Assignment {
  id: string;
  title: string;
  skill: string;
  dueDate: string | null;
  submittedAt: string | null;
  score: number | null;
  gradedAt: string | null;
}

interface WritingSubmission {
  id: string;
  taskType: string;
  estimatedBand: number | null;
  submittedAt: string;
}

interface SpeakingSubmission {
  id: string;
  partType: string;
  estimatedBand: number | null;
  submittedAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ToGradeItem {
  id: string;
  title: string;
  skill: string;
  submittedAt: string;
  dueDate: string | null;
  studentId: string;
  studentName: string;
}

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span className="label" style={{ margin: 0 }}>{label}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
      </div>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  desc,
  color,
}: {
  to: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="card"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 19,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>{desc}</p>
      </div>
    </Link>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function HomePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  return isTeacher ? <TeacherHome /> : <StudentHome />;
}

//Học viên

function StudentHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [latestWriting, setLatestWriting] = useState<WritingSubmission | null>(null);
  const [latestSpeaking, setLatestSpeaking] = useState<SpeakingSubmission | null>(null);

  useEffect(() => {
    async function load() {
      const [logsRes, dueRes, assignRes, writingRes, speakingRes] = await Promise.all([
        apiClient.get<LessonLog[]>('/api/LessonLogs'),
        apiClient.get<Vocabulary[]>('/api/Vocabularies/due'),
        apiClient.get<Assignment[]>('/api/Assignments').catch(() => ({ data: [] as Assignment[] })),
        apiClient.get<WritingSubmission[]>('/api/WritingSubmissions').catch(() => ({ data: [] as WritingSubmission[] })),
        apiClient.get<SpeakingSubmission[]>('/api/SpeakingSubmissions').catch(() => ({ data: [] as SpeakingSubmission[] })),
      ]);
      setLogs(logsRes.data.slice(0, 3));
      setDueCount(dueRes.data.length);
      setAssignments(assignRes.data);
      setLatestWriting(writingRes.data[0] ?? null);
      setLatestSpeaking(speakingRes.data[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const pendingAssignments = assignments.filter((a) => !a.submittedAt);
  const overdueCount = pendingAssignments.filter((a) => a.dueDate && new Date(a.dueDate) < new Date()).length;

  if (loading) return <p className="muted">Đang tải...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>{greeting()}, {user?.name} 👋</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Đây là những gì đang chờ bạn hôm nay.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <QuickStat icon="📖" label="Từ vựng cần ôn" value={dueCount} color="var(--primary)" />
        <QuickStat
          icon="📝"
          label="Bài tập chưa nộp"
          value={overdueCount > 0 ? `${pendingAssignments.length} (${overdueCount} quá hạn)` : pendingAssignments.length}
          color={overdueCount > 0 ? 'var(--danger)' : 'var(--accent)'}
        />
        <QuickStat icon="🗓️" label="Buổi học đã ghi" value={logs.length > 0 ? logs.length : 0} color="var(--success)" />
        <QuickStat
          icon="✍️"
          label="Band Writing gần nhất"
          value={latestWriting?.estimatedBand ?? '—'}
          color="var(--primary)"
        />
      </div>

      <h3>Việc cần làm</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <ActionCard to="/lessons" icon="🗒️" title="Ghi buổi học hôm nay" desc="Lưu lại nội dung vừa học với giáo viên" color="#6366F1" />
        <ActionCard to="/vocabulary" icon="📖" title={`Ôn từ vựng (${dueCount})`} desc="Ôn theo lịch giãn cách thông minh" color="#4F46E5" />
        <ActionCard to="/assignments" icon="📝" title="Bài tập được giao" desc={`${pendingAssignments.length} bài chưa nộp`} color="#FB7A3C" />
        <ActionCard to="/writing" icon="✍️" title="Luyện Writing" desc="Nộp bài, AI chấm band ngay lập tức" color="#0EA5E9" />
        <ActionCard to="/speaking" icon="🎙️" title="Luyện Speaking" desc="Ghi âm, AI chuyển văn bản và chấm điểm" color="#F43F5E" />
        <ActionCard to="/tests" icon="🎧" title="Đề Listening & Reading" desc="Luyện đề có tính giờ, chấm tự động" color="#16A34A" />
      </div>

      {(latestWriting || latestSpeaking) && (
        <>
          <h3>Điểm gần nhất</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
            {latestWriting && (
              <div className="list-item">
                <span className="badge badge-primary">Writing · {latestWriting.taskType}</span>
                <div className="band-score" style={{ fontSize: 26, marginTop: 8 }}>
                  {latestWriting.estimatedBand ?? '—'}
                </div>
                <span className="muted">{new Date(latestWriting.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {latestSpeaking && (
              <div className="list-item">
                <span className="badge badge-accent">Speaking · {latestSpeaking.partType}</span>
                <div className="band-score" style={{ fontSize: 26, marginTop: 8 }}>
                  {latestSpeaking.estimatedBand ?? '—'}
                </div>
                <span className="muted">{new Date(latestSpeaking.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </>
      )}

      <h3>Buổi học gần đây</h3>
      {logs.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Chưa có buổi học nào. <Link to="/lessons">Ghi buổi học đầu tiên →</Link>
          </p>
        </div>
      ) : (
        <div>
          {logs.map((log) => (
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
          <Link to="/lessons" className="muted" style={{ fontSize: 14 }}>Xem tất cả buổi học →</Link>
        </div>
      )}
    </div>
  );
}

//Giáo viên

function TeacherHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [toGrade, setToGrade] = useState<ToGradeItem[]>([]);

  useEffect(() => {
    async function load() {
      const [studentsRes, toGradeRes] = await Promise.all([
        apiClient.get<Student[]>('/api/TeacherLinks/my-students'),
        apiClient.get<ToGradeItem[]>('/api/Assignments/to-grade').catch(() => ({ data: [] as ToGradeItem[] })),
      ]);
      setStudents(studentsRes.data);
      setToGrade(toGradeRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="muted">Đang tải...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>{greeting()}, {user?.name} 👋</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Tổng quan lớp học của bạn.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <QuickStat icon="👥" label="Học viên đang theo dõi" value={students.length} color="var(--primary)" />
        <QuickStat
          icon="⏳"
          label="Bài chờ chấm"
          value={toGrade.length}
          color={toGrade.length > 0 ? 'var(--accent)' : 'var(--success)'}
        />
      </div>

      <h3>Truy cập nhanh</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <ActionCard to="/teacher" icon="👥" title="Học viên của tôi" desc="Xem nhật ký học và lỗi sai từng học viên" color="#6366F1" />
        <ActionCard to="/assignments" icon="📝" title={`Chấm bài (${toGrade.length})`} desc="Bài học viên đã nộp, đang chờ chấm" color="#FB7A3C" />
        <ActionCard to="/courses" icon="📚" title="Khóa học" desc="Tạo khoá học và thêm bài giảng" color="#16A34A" />
        <ActionCard to="/tests" icon="🎧" title="Đề Listening & Reading" desc="Xem và luyện thử các đề đã tạo" color="#0EA5E9" />
      </div>

      <h3>Bài đang chờ chấm</h3>
      {toGrade.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Không có bài nào đang chờ chấm — mọi thứ đã xong! 🎉</p>
        </div>
      ) : (
        <div>
          {toGrade.slice(0, 5).map((item) => (
            <Link key={item.id} to="/assignments" className="list-item clickable" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{item.title}</strong>
                  <span className="badge badge-primary" style={{ marginLeft: 10 }}>{item.skill}</span>
                </div>
                <span className="muted">{new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <p className="muted" style={{ margin: '8px 0 0' }}>Học viên: {item.studentName}</p>
            </Link>
          ))}
          {toGrade.length > 5 && (
            <Link to="/assignments" className="muted" style={{ fontSize: 14 }}>
              Xem tất cả {toGrade.length} bài →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}