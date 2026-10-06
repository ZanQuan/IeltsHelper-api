import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '@/api/client';
import type { WritingSubmission } from '@/types';
import './writing.css';

const fetchSubmissions = () => apiClient.get<WritingSubmission[]>('/api/WritingSubmissions').then((res) => res.data);

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
    setSubmissions(await fetchSubmissions());
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions().then((data) => {
      setSubmissions(data);
      setLoading(false);
    });
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
      <p className="muted mb-24">
        Nộp bài luận để AI chấm theo 4 tiêu chí IELTS và đưa nhận xét chi tiết.
      </p>

      <form onSubmit={handleSubmit} className="card mb-32">
        <div className="field">
          <label className="label">Dạng bài</label>
          <div className="row-gap-8">
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
          <div className="writing-label-row">
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
            className="input lh-1_8"
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            required
            rows={14}
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
              <div className="row-between">
                <div>
                  <span className="badge badge-primary">{s.taskType}</span>
                  <span className="muted ml-10">
                    {new Date(s.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {s.estimatedBand != null && (
                  <span className="band-score">Band {s.estimatedBand}</span>
                )}
              </div>
              <p className="muted m-10-0">{s.prompt}</p>
              {s.feedback && (
                <div className="info-box">
                  <p className="label c-primary">Nhận xét từ AI</p>
                  <p className="pre-text">{s.feedback}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(s.id)}
                className="btn btn-ghost btn-sm mt-12"
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
