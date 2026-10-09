import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaBookOpen, FaChartPie, FaFileLines, FaHouse, FaRightFromBracket, FaUsers } from 'react-icons/fa6';
import { useAuth } from '@/features/auth/useAuth';
import './layout.css';
import LiveClassNotifier from './LiveClassNotifier';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const iconBox = { fontSize: 15, width: 18, display: 'inline-flex', justifyContent: 'center' } as const;

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [{ to: '/admin', label: 'Dashboard', icon: <FaChartPie />, end: true }],
  },
  {
    title: 'Quản lý',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: <FaUsers /> },
      { to: '/admin/courses', label: 'Khoá học', icon: <FaBookOpen /> },
      { to: '/admin/tests', label: 'Đề thi', icon: <FaFileLines /> },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'Admin') {
    return (
      <div className="page">
        <div className="card">
          <h3>Không có quyền truy cập</h3>
          <p className="muted">Khu vực này chỉ dành cho quản trị viên.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
    background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
    textDecoration: 'none',
  });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <div className="admin-sidebar-title">
            Whale English
          </div>
          <div className="admin-sidebar-subtitle">
            KHU VỰC QUẢN TRỊ
          </div>
        </div>

        <nav className="admin-nav">
          {SECTIONS.map((section) => (
            <div className="mb-18" key={section.title}>
              <div className="sidebar-group-label">
                {section.title}
              </div>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>
                  <span style={iconBox}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="mb-18">
            <div className="sidebar-group-label">
              Điều hướng
            </div>
            <NavLink to="/" style={linkStyle}>
              <span style={iconBox}><FaHouse /></span>
              Về trang học viên
            </NavLink>
            <button className="admin-logout-btn"
              onClick={logout}
            >
              <span style={iconBox}><FaRightFromBracket /></span>
              Đăng xuất
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-user">
          <div className="admin-sidebar-user-name">{user?.name}</div>
          <div className="fs-12">Quản trị viên</div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
      <LiveClassNotifier />
    </div>
  );
}