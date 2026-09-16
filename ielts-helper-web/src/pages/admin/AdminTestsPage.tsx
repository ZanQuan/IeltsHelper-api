import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';

interface TestSummary {
  id: string;
  skill: string;
  title: string;
  timeLimitMinutes: number;
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  async function loadTests() {
    setLoading(true);
    const res = await apiClient.get<TestSummary[]>('/api/Tests');
    setTests(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadTests();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      const matchSearch = !q || t.title.toLowerCase().includes(q);
      const matchSkill = !skillFilter || t.skill === skillFilter;
      return matchSearch && matchSkill;
    });
  }, [tests, search, skillFilter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xoá đề thi "${title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await apiClient.delete(`/api/Tests/${id}`);
      await loadTests();
    } catch {
      alert('Xoá đề thi thất bại.');
    }
  }

  return (
    <div>
      <h2>Đề thi</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Ngân hàng đề Listening &amp; Reading dùng chung cho toàn hệ thống.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <span className="muted">{filtered.length} đề thi</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ width: 240 }}
            placeholder="Tìm theo tên đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            style={{ width: 160 }}
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          >
            <option value="">Tất cả kỹ năng</option>
            <option value="Listening">Listening</option>
            <option value="Reading">Reading</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            {search || skillFilter ? 'Không tìm thấy đề thi nào khớp bộ lọc.' : 'Chưa có đề thi nào.'}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Tên đề</th>
                <th>Kỹ năng</th>
                <th>Thời gian</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td>
                    <span className="badge badge-primary">{t.skill}</span>
                  </td>
                  <td className="muted">{t.timeLimitMinutes} phút</td>
                  <td>
                    <button
                      className="btn"
                      style={{
                        padding: '6px 14px',
                        fontSize: 13,
                        background: 'var(--danger-light)',
                        color: 'var(--danger)',
                      }}
                      onClick={() => handleDelete(t.id, t.title)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
