import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalCourses: number;
  totalEnrollments: number;
  revenue: number;
  pendingGrading: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLES = ['Student', 'Teacher', 'Admin'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadStats() {
    const res = await apiClient.get<Stats>('/api/Admin/stats');
    setStats(res.data);
  }

  async function loadUsers() {
    setLoading(true);
    const res = await apiClient.get<AdminUser[]>('/api/Admin/users', {
      params: roleFilter ? { role: roleFilter } : {},
    });
    setUsers(res.data);
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadUsers(); }, [roleFilter]);

  async function handleRoleChange(id: string, newRole: string) {
    setSavingId(id);
    try {
      await apiClient.put(`/api/Admin/users/${id}/role`, { role: newRole });
      await loadUsers();
      await loadStats();
    } catch {
      alert('Đổi vai trò thất bại.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá tài khoản này? Hành động này không thể hoàn tác.')) return;
    await apiClient.delete(`/api/Admin/users/${id}`);
    await loadUsers();
    await loadStats();
  }

  if (user?.role !== 'Admin') {
    return <p className="muted">Bạn không có quyền truy cập trang này.</p>;
  }

  return (
    <div>
      <h2>Quản trị hệ thống</h2>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card"><div className="muted">Học viên</div><h3>{stats.totalStudents}</h3></div>
          <div className="card"><div className="muted">Giáo viên</div><h3>{stats.totalTeachers}</h3></div>
          <div className="card"><div className="muted">Quản trị viên</div><h3>{stats.totalAdmins}</h3></div>
          <div className="card"><div className="muted">Khoá học</div><h3>{stats.totalCourses}</h3></div>
          <div className="card"><div className="muted">Lượt ghi danh</div><h3>{stats.totalEnrollments}</h3></div>
          <div className="card"><div className="muted">Doanh thu</div><h3>{stats.revenue.toLocaleString('vi-VN')}đ</h3></div>
          <div className="card"><div className="muted">Bài chờ chấm</div><h3>{stats.pendingGrading}</h3></div>
        </div>
      )}

      <h3>Danh sách người dùng</h3>
      <div style={{ marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 200 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="Student">Học viên</option>
          <option value="Teacher">Giáo viên</option>
          <option value="Admin">Quản trị viên</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : (
        <div>
          {users.map((u) => (
            <div key={u.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{u.name}</strong>
                <p className="muted" style={{ margin: '2px 0 0' }}>{u.email}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="input"
                  style={{ width: 130 }}
                  value={u.role}
                  disabled={savingId === u.id || u.id === user?.userId}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  disabled={u.id === user?.userId}
                  onClick={() => handleDelete(u.id)}
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}