import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [{ to: '/admin', label: 'Dashboard', icon: '📊', end: true }],
  },
  {
    title: 'Quản lý',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: '👥' },
      { to: '/admin/courses', label: 'Khoá học', icon: '📚' },
      { to: '/admin/tests', label: 'Đề thi', icon: '📝' },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: '#141826',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
            Whale English
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>
            KHU VỰC QUẢN TRỊ
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: 12 }}>
          {SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 18 }}>
              <div
                style={{
                  padding: '0 20px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                {section.title}
              </div>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                padding: '0 20px 8px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              Điều hướng
            </div>
            <NavLink to="/" style={linkStyle}>
              <span style={{ fontSize: 15 }}>🏠</span>
              Về trang học viên
            </NavLink>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 20px',
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderLeft: '3px solid transparent',
                color: '#F87171',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15 }}>🚪</span>
              Đăng xuất
            </button>
          </div>
        </nav>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13,
          }}
        >
          <div style={{ color: 'white', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 12 }}>Quản trị viên</div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 60px' }}>
        <Outlet />
      </main>
    </div>
  );
}
