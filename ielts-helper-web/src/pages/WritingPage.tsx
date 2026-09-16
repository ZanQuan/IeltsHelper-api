import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../api/client';

interface WritingSubmission {
  id: string;
  taskType: string;
  prompt: string;
  essayText: string;
  submittedAt: string;
  estimatedBand: number | null;
  feedback: string | null;
}

export default function WritingPage() {
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [taskType, setTaskType] = useState('Task 2');
  const [prompt, setPrompt] = useState('');
  const [essayText, setEssayText] = useState('');
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');

  async function loadSubmissions() {
    setLoading(true);
    const res = await apiClient.get<WritingSubmission[]>('/api/WritingSubmissions');
    setSubmissions(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const minWords = taskType === 'Task 1' ? 150 : 250;
  const enoughWords = wordCount >= minWords;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setGrading(true);
    try {
      await apiClient.post('/api/WritingSubmissions', { taskType, prompt, essayText });
      setPrompt('');
      setEssayText('');
      await loadSubmissions();
    } catch {
      setError('Chấm bài thất bại — kiểm tra lại API key hoặc thử lại sau.');
    } finally {
      setGrading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bài viết này?')) return;
    await apiClient.delete(`/api/WritingSubmissions/${id}`);
    await loadSubmissions();
  }

  return (
    <div>
      <h2>Writing</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Nộp bài luận để AI chấm theo 4 tiêu chí IELTS và đưa nhận xét chi tiết.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 32 }}>
        <div className="field">
          <label className="label">Dạng bài</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Task 1', 'Task 2'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTaskType(t)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  padding: '8px 20px',
                  background: taskType === t ? 'var(--primary)' : 'var(--primary-light)',
                  color: taskType === t ? 'white' : 'var(--primary)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Đề bài</label>
          <textarea
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={2}
            placeholder="Dán đề bài vào đây..."
          />
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="label">Bài làm</label>
            <span
              className="badge"
              style={{
                background: enoughWords ? 'var(--success-light)' : 'var(--accent-light)',
                color: enoughWords ? 'var(--success)' : 'var(--accent)',
              }}
            >
              {wordCount} / {minWords} từ
            </span>
          </div>
          <textarea
            className="input"
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            required
            rows={14}
            style={{ lineHeight: 1.8 }}
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={grading} className="btn btn-primary">
          {grading ? 'AI đang chấm bài (10-20 giây)...' : 'Nộp bài chấm điểm'}
        </button>
      </form>

      <h3>Lịch sử bài đã nộp</h3>
      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : submissions.length === 0 ? (
        <p className="muted">Chưa có bài nào.</p>
      ) : (
        <div>
          {submissions.map((s) => (
            <div key={s.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-primary">{s.taskType}</span>
                  <span className="muted" style={{ marginLeft: 10 }}>
                    {new Date(s.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {s.estimatedBand != null && (
                  <span className="band-score">Band {s.estimatedBand}</span>
                )}
              </div>
              <p className="muted" style={{ margin: '10px 0' }}>{s.prompt}</p>
              {s.feedback && (
                <div
                  style={{
                    background: 'var(--primary-light)',
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 8,
                  }}
                >
                  <p className="label" style={{ color: 'var(--primary)' }}>Nhận xét từ AI</p>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{s.feedback}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(s.id)}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 13, marginTop: 12 }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
