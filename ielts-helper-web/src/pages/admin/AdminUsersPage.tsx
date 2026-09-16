import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

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

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const res = await apiClient.get<AdminUser[]>('/api/Admin/users', {
      params: roleFilter ? { role: roleFilter } : {},
    });
    setUsers(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
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
      <p className="muted" style={{ marginBottom: 24 }}>
        Quản lý toàn bộ tài khoản: đổi vai trò hoặc gỡ khỏi hệ thống.
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
        <span className="muted">{filteredUsers.length} tài khoản</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ width: 240 }}
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            style={{ width: 170 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
          <p className="muted" style={{ margin: 0 }}>
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
                <th style={{ width: 170 }}>Đổi vai trò</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === user?.userId;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {initials(u.name)}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {u.name}
                          {isSelf && <span className="muted" style={{ marginLeft: 6 }}>(bạn)</span>}
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
                        className="input"
                        style={{ padding: '7px 10px', fontSize: 14 }}
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
