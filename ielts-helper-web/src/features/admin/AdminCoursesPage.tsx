import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/client';
import type { CourseSummary } from '@/types';
import './admin.css';

const fetchCourses = () => apiClient.get<CourseSummary[]>('/api/Courses').then((res) => res.data);

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadCourses() {
    setLoading(true);
    setCourses(await fetchCourses());
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
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
      <p className="muted mb-24">
        Toàn bộ khoá học trong hệ thống, do mọi giáo viên tạo ra.
      </p>

      <div className="toolbar">
        <span className="muted">
          {filtered.length} khoá học · tổng giá trị {totalValue.toLocaleString('vi-VN')}đ
        </span>
        <input
          className="input w-260"
          placeholder="Tìm theo tên khoá hoặc giáo viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="muted m-0">
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
                <th className="w-90"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="fw-600">{c.title}</div>
                    <div className="muted fs-13">{c.description}</div>
                  </td>
                  <td className="muted">{c.teacherName}</td>
                  <td>
                    <span className="badge badge-primary">{c.targetBand}</span>
                  </td>
                  <td>{c.lessonCount}</td>
                  <td className="admin-price-cell">
                    {c.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td>
                    <button
                      className="btn btn-danger-soft"
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
