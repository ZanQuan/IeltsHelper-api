import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalCourses: number;
  totalEnrollments: number;
  revenue: number;
  pendingGrading: number;
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span className="label" style={{ margin: 0 }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Stats>('/api/Admin/stats').then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="muted">Đang tải...</p>;
  if (!stats) return <p className="muted">Không tải được số liệu.</p>;

  const totalUsers = stats.totalStudents + stats.totalTeachers + stats.totalAdmins;

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Tổng quan số liệu toàn hệ thống.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <StatCard label="Tổng người dùng" value={totalUsers} color="var(--text)" icon="👥" />
        <StatCard label="Học viên" value={stats.totalStudents} color="var(--primary)" icon="🎓" />
        <StatCard label="Giáo viên" value={stats.totalTeachers} color="var(--accent)" icon="🧑‍🏫" />
        <StatCard label="Quản trị viên" value={stats.totalAdmins} color="var(--success)" icon="🛡️" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <StatCard label="Khoá học" value={stats.totalCourses} color="var(--primary)" icon="📚" />
        <StatCard label="Lượt ghi danh" value={stats.totalEnrollments} color="var(--primary)" icon="✍️" />
        <StatCard
          label="Doanh thu"
          value={`${stats.revenue.toLocaleString('vi-VN')}đ`}
          color="var(--success)"
          icon="💰"
        />
        <StatCard label="Bài chờ chấm" value={stats.pendingGrading} color="var(--accent)" icon="⏳" />
      </div>

      <h3>Truy cập nhanh</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Link to="/admin/users" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Quản lý người dùng →</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>Đổi vai trò, xoá tài khoản</p>
        </Link>
        <Link to="/admin/courses" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Quản lý khoá học →</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>Xem và gỡ khoá học khỏi hệ thống</p>
        </Link>
        <Link to="/admin/tests" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Quản lý đề thi →</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>Xem và gỡ đề Listening/Reading</p>
        </Link>
      </div>
    </div>
  );
}
