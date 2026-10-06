import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/client';
import type { TestSummary } from '@/types';

const fetchTests = () => apiClient.get<TestSummary[]>('/api/Tests').then((res) => res.data);

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  async function loadTests() {
    setLoading(true);
    setTests(await fetchTests());
    setLoading(false);
  }

  useEffect(() => {
    fetchTests().then((data) => {
      setTests(data);
      setLoading(false);
    });
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
      <p className="muted mb-24">
        Ngân hàng đề Listening &amp; Reading dùng chung cho toàn hệ thống.
      </p>

      <div className="toolbar">
        <span className="muted">{filtered.length} đề thi</span>
        <div className="row-wrap-10">
          <input
            className="input w-240"
            placeholder="Tìm theo tên đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-160"
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
          <p className="muted m-0">
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
                <th className="w-90"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="fw-600">{t.title}</td>
                  <td>
                    <span className="badge badge-primary">{t.skill}</span>
                  </td>
                  <td className="muted">{t.timeLimitMinutes} phút</td>
                  <td>
                    <button
                      className="btn btn-danger-soft"
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
