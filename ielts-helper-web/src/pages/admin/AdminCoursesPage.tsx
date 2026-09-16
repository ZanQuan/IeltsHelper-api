import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';

interface CourseSummary {
  id: string;
  title: string;
  description: string;
  targetBand: string;
  price: number;
  teacherName: string;
  lessonCount: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadCourses() {
    setLoading(true);
    const res = await apiClient.get<CourseSummary[]>('/api/Courses');
    setCourses(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.teacherName.toLowerCase().includes(q)
    );
  }, [courses, search]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xoá khoá học "${title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await apiClient.delete(`/api/Courses/${id}`);
      await loadCourses();
    } catch {
      alert('Xoá khoá học thất bại.');
    }
  }

  const totalValue = filtered.reduce((sum, c) => sum + c.price, 0);

  return (
    <div>
      <h2>Khoá học</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Toàn bộ khoá học trong hệ thống, do mọi giáo viên tạo ra.
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
        <span className="muted">
          {filtered.length} khoá học · tổng giá trị {totalValue.toLocaleString('vi-VN')}đ
        </span>
        <input
          className="input"
          style={{ width: 260 }}
          placeholder="Tìm theo tên khoá hoặc giáo viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            {search ? 'Không tìm thấy khoá học nào khớp từ khoá.' : 'Chưa có khoá học nào.'}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Khoá học</th>
                <th>Giáo viên</th>
                <th>Band</th>
                <th>Số bài</th>
                <th>Giá</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{c.description}</div>
                  </td>
                  <td className="muted">{c.teacherName}</td>
                  <td>
                    <span className="badge badge-primary">{c.targetBand}</span>
                  </td>
                  <td>{c.lessonCount}</td>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {c.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{
                        padding: '6px 14px',
                        fontSize: 13,
                        background: 'var(--danger-light)',
                        color: 'var(--danger)',
                      }}
                      onClick={() => handleDelete(c.id, c.title)}
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
