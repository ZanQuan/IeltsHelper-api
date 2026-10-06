import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import type { Assignment } from '@/types';
import StatusBadge from './StatusBadge';
import { fmtDate } from './fmtDate';
import './assignments.css';

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
      <div className="container-700">
        <button onClick={() => setSelected(null)} className="btn btn-ghost btn-back">
          ← Quay lại danh sách bài tập
        </button>

        <div className="card mb-20">
          <div className="row-between-gap">
            <div>
              <span className="badge badge-primary mb-10">{selected.skill}</span>
              <h2 className="m-8-0-4">{selected.title}</h2>
              {selected.dueDate && <p className="muted m-0">Hạn nộp: {fmtDate(selected.dueDate)}</p>}
            </div>
            <StatusBadge assignment={selected} />
          </div>
          {selected.instructions && (
            <p className="mt-16 ws-pre-wrap">{selected.instructions}</p>
          )}
        </div>

        {graded && (
          <div className="card assign-result-card">
            <h3 className="mt-0">Kết quả</h3>
            <p className="band-score m-0-0-10">{selected.score}/10</p>
            {selected.feedback && <p className="pre-text">{selected.feedback}</p>}
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
      <p className="muted mb-24">Bài tập giáo viên giao cho bạn.</p>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : assignments.length === 0 ? (
        <div className="card">
          <p className="muted m-0">Bạn chưa có bài tập nào.</p>
        </div>
      ) : (
        assignments.map((a) => (
          <div key={a.id} className="list-item clickable" onClick={() => open(a)}>
            <div className="row-between-gap">
              <div>
                <span className="badge badge-primary mr-8">{a.skill}</span>
                <strong>{a.title}</strong>
                {a.dueDate && <p className="muted m-6-0-0">Hạn nộp: {fmtDate(a.dueDate)}</p>}
              </div>
              <StatusBadge assignment={a} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
