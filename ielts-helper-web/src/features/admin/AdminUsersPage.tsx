import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import './admin.css';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLES = ['Student', 'Teacher', 'Admin'];

const ROLE_LABEL: Record<string, string> = {
  Student: 'Học viên',
  Teacher: 'Giáo viên',
  Admin: 'Quản trị viên',
};

const ROLE_BADGE: Record<string, string> = {
  Student: 'badge-primary',
  Teacher: 'badge-accent',
  Admin: 'badge-success',
};

const fetchUsers = (role: string) =>
  apiClient
    .get<AdminUser[]>('/api/Admin/users', { params: role ? { role } : {} })
    .then((res) => res.data);

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Dùng sau khi đổi vai trò / xoá tài khoản: hiện lại "Đang tải..."
  async function loadUsers() {
    setLoading(true);
    setUsers(await fetchUsers(roleFilter));
    setLoading(false);
  }

  // Tải lại mỗi khi đổi bộ lọc vai trò ("ignore" bỏ kết quả cũ nếu đổi lọc nhanh)
  useEffect(() => {
    let ignore = false;
    fetchUsers(roleFilter).then((data) => {
      if (ignore) return;
      setUsers(data);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [roleFilter]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(id: string, newRole: string) {
    setSavingId(id);
    try {
      await apiClient.put(`/api/Admin/users/${id}/role`, { role: newRole });
      await loadUsers();
    } catch {
      alert('Đổi vai trò thất bại.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xoá tài khoản "${name}"? Hành động này không thể hoàn tác.`)) return;
    await apiClient.delete(`/api/Admin/users/${id}`);
    await loadUsers();
  }

  function initials(name: string) {
    return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  }

  return (
    <div>
      <h2>Người dùng</h2>
      <p className="muted mb-24">
        Quản lý toàn bộ tài khoản: đổi vai trò hoặc gỡ khỏi hệ thống.
      </p>

      <div className="toolbar">
        <span className="muted">{filteredUsers.length} tài khoản</span>
        <div className="row-wrap-10">
          <input
            className="input w-240"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-170"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setLoading(true);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Student">Học viên</option>
            <option value="Teacher">Giáo viên</option>
            <option value="Admin">Quản trị viên</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="card">
          <p className="muted m-0">
            {search ? 'Không tìm thấy tài khoản nào khớp từ khoá.' : 'Chưa có tài khoản nào.'}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th className="w-170">Đổi vai trò</th>
                <th className="w-90"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === user?.userId;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="row-center-10">
                        <span className="admin-user-avatar">
                          {initials(u.name)}
                        </span>
                        <span className="fw-600">
                          {u.name}
                          {isSelf && <span className="muted ml-6">(bạn)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="muted">{u.email}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-primary'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        className="input admin-role-select"
                        value={u.role}
                        disabled={savingId === u.id || isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn"
                        style={{
                          padding: '6px 14px',
                          fontSize: 13,
                          background: isSelf ? 'var(--border)' : 'var(--danger-light)',
                          color: isSelf ? 'var(--text-muted)' : 'var(--danger)',
                          cursor: isSelf ? 'default' : 'pointer',
                        }}
                        disabled={isSelf}
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
