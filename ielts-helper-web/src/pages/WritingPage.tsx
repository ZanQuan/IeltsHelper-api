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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Writing — nộp bài và chấm bằng AI</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <div>
          <label>Dạng bài</label><br />
          <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
            <option value="Task 1">Task 1</option>
            <option value="Task 2">Task 2</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Đề bài</label><br />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required style={{ width: '100%' }} rows={2} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Bài làm ({wordCount} từ)</label><br />
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            required
            style={{ width: '100%' }}
            rows={12}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={grading} style={{ marginTop: 12 }}>
          {grading ? 'Đang chấm bài (10-20 giây)...' : 'Nộp bài'}
        </button>
      </form>

      <h3>Lịch sử bài đã nộp</h3>
      {loading ? (
        <p>Đang tải...</p>
      ) : submissions.length === 0 ? (
        <p>Chưa có bài nào.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {submissions.map((s) => (
            <li key={s.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{s.taskType} — {new Date(s.submittedAt).toLocaleDateString('vi-VN')}</strong>
                {s.estimatedBand != null && (
                  <span style={{ fontWeight: 'bold', fontSize: 18, color: '#2980b9' }}>Band {s.estimatedBand}</span>
                )}
              </div>
              <p style={{ margin: '8px 0', color: '#666' }}>{s.prompt}</p>
              {s.feedback && (
                <div style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, marginTop: 8 }}>
                  <strong>Nhận xét AI:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{s.feedback}</p>
                </div>
              )}
              <button onClick={() => handleDelete(s.id)} style={{ marginTop: 8 }}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}