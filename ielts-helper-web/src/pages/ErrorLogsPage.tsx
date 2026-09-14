import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../api/client';

interface ErrorLog {
  id: string;
  errorType: string;
  description: string;
}

interface ErrorStat {
  errorType: string;
  count: number;
}

const ERROR_TYPES = ['Tense', 'Article', 'Collocation', 'Preposition', 'Word Order', 'Pronunciation', 'Khác'];

export default function ErrorLogsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStat[]>([]);
  const [loading, setLoading] = useState(true);

  const [errorType, setErrorType] = useState(ERROR_TYPES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [errorsRes, statsRes] = await Promise.all([
      apiClient.get<ErrorLog[]>('/api/ErrorLogs'),
      apiClient.get<ErrorStat[]>('/api/ErrorLogs/stats'),
    ]);
    setErrors(errorsRes.data);
    setStats(statsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/ErrorLogs', { errorType, description });
      setDescription('');
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa lỗi sai này?')) return;
    await apiClient.delete(`/api/ErrorLogs/${id}`);
    await loadData();
  }

  const maxCount = Math.max(1, ...stats.map((s) => s.count));

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Nhật ký lỗi sai</h2>

      {stats.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Thống kê lỗi hay lặp lại</h3>
          {stats.map((s) => (
            <div key={s.errorType} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{s.errorType}</span>
                <span>{s.count}</span>
              </div>
              <div style={{ background: '#eee', borderRadius: 4, height: 8 }}>
                <div
                  style={{
                    width: `${(s.count / maxCount) * 100}%`,
                    background: '#e67e22',
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>Ghi lỗi sai mới</h3>
        <div>
          <label>Loại lỗi</label><br />
          <select value={errorType} onChange={(e) => setErrorType(e.target.value)}>
            {ERROR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Mô tả lỗi</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ width: '100%' }}
            rows={2}
            placeholder="Ví dụ: Quên dùng 'the' trước danh từ đã xác định"
          />
        </div>
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Đang lưu...' : 'Lưu lỗi sai'}
        </button>
      </form>

      <h3>Danh sách lỗi sai</h3>
      {loading ? (
        <p>Đang tải...</p>
      ) : errors.length === 0 ? (
        <p>Chưa có lỗi sai nào được ghi lại.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {errors.map((err) => (
            <li key={err.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
              <strong>{err.errorType}</strong>
              <p style={{ margin: '4px 0' }}>{err.description}</p>
              <button onClick={() => handleDelete(err.id)}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}