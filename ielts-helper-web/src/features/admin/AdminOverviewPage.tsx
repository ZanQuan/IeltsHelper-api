import { useState, useEffect, type ReactNode } from 'react';
import { FaBookOpen, FaChalkboardUser, FaHourglassHalf, FaMoneyBillWave, FaShieldHalved, FaUserGraduate, FaUserPlus, FaUsers } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import './admin.css';

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
  icon: ReactNode;
}) {
  return (
    <div className="card card-flush">
      <div style={{ height: 4, background: color }} />
      <div className="p-16-20">
        <div className="row-center-8-mb-6">
          <span style={{ fontSize: 16, color, display: 'inline-flex' }}>{icon}</span>
          <span className="label m-0">{label}</span>
        </div>
        <div className="admin-stat-value">{value}</div>
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
      <p className="muted mb-24">Tổng quan số liệu toàn hệ thống.</p>

      <div className="admin-stat-grid">
        <StatCard label="Tổng người dùng" value={totalUsers} color="var(--text)" icon={<FaUsers />} />
        <StatCard label="Học viên" value={stats.totalStudents} color="var(--primary)" icon={<FaUserGraduate />} />
        <StatCard label="Giáo viên" value={stats.totalTeachers} color="var(--accent)" icon={<FaChalkboardUser />} />
        <StatCard label="Quản trị viên" value={stats.totalAdmins} color="var(--success)" icon={<FaShieldHalved />} />
      </div>

      <div className="card-grid-180">
        <StatCard label="Khoá học" value={stats.totalCourses} color="var(--primary)" icon={<FaBookOpen />} />
        <StatCard label="Lượt ghi danh" value={stats.totalEnrollments} color="var(--primary)" icon={<FaUserPlus />} />
        <StatCard
          label="Doanh thu"
          value={`${stats.revenue.toLocaleString('vi-VN')}đ`}
          color="var(--success)"
          icon={<FaMoneyBillWave />}
        />
        <StatCard label="Bài chờ chấm" value={stats.pendingGrading} color="var(--accent)" icon={<FaHourglassHalf />} />
      </div>

      <h3>Truy cập nhanh</h3>
      <div className="admin-link-grid">
        <Link to="/admin/users" className="card link-plain">
          <strong>Quản lý người dùng →</strong>
          <p className="muted m-6-0-0">Đổi vai trò, xoá tài khoản</p>
        </Link>
        <Link to="/admin/courses" className="card link-plain">
          <strong>Quản lý khoá học →</strong>
          <p className="muted m-6-0-0">Xem và gỡ khoá học khỏi hệ thống</p>
        </Link>
        <Link to="/admin/tests" className="card link-plain">
          <strong>Quản lý đề thi →</strong>
          <p className="muted m-6-0-0">Xem và gỡ đề Listening/Reading</p>
        </Link>
      </div>
    </div>
  );
}
