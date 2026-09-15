import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../api/client';

interface LessonLog {
  id: string;
  lessonDate: string;
  skillFocus: string;
  summary: string;
  homework: string | null;
  selfRating: number;
}

export default function LessonLogsPage() {
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [lessonDate, setLessonDate] = useState('');
  const [skillFocus, setSkillFocus] = useState('Speaking');
  const [summary, setSummary] = useState('');
  const [homework, setHomework] = useState('');
  const [selfRating, setSelfRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  async function loadLogs() {
    setLoading(true);
    const res = await apiClient.get<LessonLog[]>('/api/LessonLogs');
    setLogs(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/LessonLogs', {
        lessonDate,
        skillFocus,
        summary,
        homework: homework || null,
        selfRating,
      });
      setLessonDate('');
      setSummary('');
      setHomework('');
      setSelfRating(3);
      await loadLogs();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa buổi học này?')) return;
    await apiClient.delete(`/api/LessonLogs/${id}`);
    await loadLogs();
  }

  return (
    <div>
      <h2>Nhật ký buổi học</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Ghi lại mỗi buổi học với giáo viên để theo dõi tiến độ theo thời gian.</p>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 32 }}>
        <h3>Ghi buổi học mới</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label className="label">Ngày học</label>
            <input className="input" type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Kỹ năng trọng tâm</label>
            <select className="input" value={skillFocus} onChange={(e) => setSkillFocus(e.target.value)}>
              <option value="Speaking">Speaking</option>
              <option value="Writing">Writing</option>
              <option value="Listening">Listening</option>
              <option value="Reading">Reading</option>
              <option value="Grammar">Grammar</option>
              <option value="Vocabulary">Vocabulary</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Tóm tắt buổi học</label>
          <textarea className="input" value={summary} onChange={(e) => setSummary(e.target.value)} required rows={2} />
        </div>
        <div className="field">
          <label className="label">Bài tập về nhà (không bắt buộc)</label>
          <textarea className="input" value={homework} onChange={(e) => setHomework(e.target.value)} rows={2} />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label className="label">Tự đánh giá hiểu bài (1-5)</label>
          <input className="input" type="number" min={1} max={5} value={selfRating} onChange={(e) => setSelfRating(Number(e.target.value))} />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Đang lưu...' : 'Lưu buổi học'}
        </button>
      </form>

      <h3>Danh sách buổi học</h3>
      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : logs.length === 0 ? (
        <p className="muted">Chưa có buổi học nào.</p>
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
              <p style={{ margin: '10px 0 4px' }}>{log.summary}</p>
              {log.homework && <p className="muted" style={{ fontStyle: 'italic' }}>Bài tập: {log.homework}</p>}
              <button onClick={() => handleDelete(log.id)} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13, marginTop: 8 }}>
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}