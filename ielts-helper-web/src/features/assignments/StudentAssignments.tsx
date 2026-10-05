import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import type { Assignment } from '@/types';
import StatusBadge from './StatusBadge';
import { fmtDate } from './fmtDate';

const fetchAssignments = () => apiClient.get<Assignment[]>('/api/Assignments').then((res) => res.data);

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setAssignments(await fetchAssignments());
    setLoading(false);
  }

  useEffect(() => {
    fetchAssignments().then((data) => {
      setAssignments(data);
      setLoading(false);
    });
  }, []);

  function open(a: Assignment) {
    setSelected(a);
    setAnswer(a.answerText ?? '');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post<Assignment>(`/api/Assignments/${selected.id}/submit`, { answerText: answer });
      setSelected(res.data);
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Nộp bài thất bại.' : 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (selected) {
    const graded = !!selected.gradedAt;
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14, marginBottom: 16 }}>
          ← Quay lại danh sách bài tập
        </button>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 10 }}>{selected.skill}</span>
              <h2 style={{ margin: '8px 0 4px' }}>{selected.title}</h2>
              {selected.dueDate && <p className="muted" style={{ margin: 0 }}>Hạn nộp: {fmtDate(selected.dueDate)}</p>}
            </div>
            <StatusBadge assignment={selected} />
          </div>
          {selected.instructions && (
            <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{selected.instructions}</p>
          )}
        </div>

        {graded && (
          <div className="card" style={{ marginBottom: 20, background: 'var(--success-light)', border: '1px solid var(--success)' }}>
            <h3 style={{ marginTop: 0 }}>Kết quả</h3>
            <p className="band-score" style={{ margin: '0 0 10px' }}>{selected.score}/10</p>
            {selected.feedback && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selected.feedback}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label className="label">{graded ? 'Bài đã nộp' : 'Bài làm của bạn'}</label>
            <textarea
              className="input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={10}
              required
              disabled={graded}
              placeholder="Nhập nội dung bài làm..."
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {!graded && (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang nộp...' : selected.submittedAt ? 'Nộp lại' : 'Nộp bài'}
            </button>
          )}
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>Bài tập</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Bài tập giáo viên giao cho bạn.</p>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : assignments.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Bạn chưa có bài tập nào.</p>
        </div>
      ) : (
        assignments.map((a) => (
          <div key={a.id} className="list-item clickable" onClick={() => open(a)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span className="badge badge-primary" style={{ marginRight: 8 }}>{a.skill}</span>
                <strong>{a.title}</strong>
                {a.dueDate && <p className="muted" style={{ margin: '6px 0 0' }}>Hạn nộp: {fmtDate(a.dueDate)}</p>}
              </div>
              <StatusBadge assignment={a} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
