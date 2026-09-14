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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Nhật ký buổi học</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>Ghi buổi học mới</h3>
        <div>
          <label>Ngày học</label><br />
          <input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Kỹ năng trọng tâm</label><br />
          <select value={skillFocus} onChange={(e) => setSkillFocus(e.target.value)}>
            <option value="Speaking">Speaking</option>
            <option value="Writing">Writing</option>
            <option value="Listening">Listening</option>
            <option value="Reading">Reading</option>
            <option value="Grammar">Grammar</option>
            <option value="Vocabulary">Vocabulary</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Tóm tắt buổi học</label><br />
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} required style={{ width: '100%' }} rows={2} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Bài tập về nhà (không bắt buộc)</label><br />
          <textarea value={homework} onChange={(e) => setHomework(e.target.value)} style={{ width: '100%' }} rows={2} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Tự đánh giá hiểu bài (1-5)</label><br />
          <input type="number" min={1} max={5} value={selfRating} onChange={(e) => setSelfRating(Number(e.target.value))} />
        </div>
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Đang lưu...' : 'Lưu buổi học'}
        </button>
      </form>

      <h3>Danh sách buổi học</h3>
      {loading ? (
        <p>Đang tải...</p>
      ) : logs.length === 0 ? (
        <p>Chưa có buổi học nào.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {logs.map((log) => (
            <li key={log.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
              <strong>{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</strong> — {log.skillFocus} (đánh giá: {log.selfRating}/5)
              <p style={{ margin: '4px 0' }}>{log.summary}</p>
              {log.homework && <p style={{ margin: '4px 0', fontStyle: 'italic' }}>Bài tập: {log.homework}</p>}
              <button onClick={() => handleDelete(log.id)}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}