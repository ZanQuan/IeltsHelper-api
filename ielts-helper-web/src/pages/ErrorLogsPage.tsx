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
    <div>
      <h2>Nhật ký lỗi sai</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Ghi lại lỗi giáo viên chỉ ra để biết mình đang yếu chỗ nào và lặp lại lỗi gì nhiều nhất.
      </p>

      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Lỗi hay lặp lại</h3>
          {stats.map((s) => (
            <div key={s.errorType} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.errorType}</span>
                <span className="muted">{s.count} lần</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 999, height: 8 }}>
                <div
                  style={{
                    width: `${(s.count / maxCount) * 100}%`,
                    background: 'var(--accent)',
                    height: 8,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 32 }}>
        <h3>Ghi lỗi sai mới</h3>
        <div className="field">
          <label className="label">Loại lỗi</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ERROR_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setErrorType(t)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  padding: '8px 16px',
                  background: errorType === t ? 'var(--primary)' : 'var(--primary-light)',
                  color: errorType === t ? 'white' : 'var(--primary)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">Mô tả lỗi</label>
          <textarea
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            placeholder="Ví dụ: Quên dùng 'the' trước danh từ đã xác định"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Đang lưu...' : 'Lưu lỗi sai'}
        </button>
      </form>

      <h3>Danh sách lỗi sai</h3>
      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : errors.length === 0 ? (
        <p className="muted">Chưa có lỗi sai nào được ghi lại.</p>
      ) : (
        <div>
          {errors.map((err) => (
            <div key={err.id} className="list-item">
              <span className="badge badge-accent">{err.errorType}</span>
              <p style={{ margin: '10px 0 8px' }}>{err.description}</p>
              <button
                onClick={() => handleDelete(err.id)}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 13 }}
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
