import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';

export default function Layout() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Trang chủ' },
    { to: '/lessons', label: 'Buổi học' },
    { to: '/vocabulary', label: 'Từ vựng' },
    { to: '/errors', label: 'Lỗi sai' },
    { to: '/writing', label: 'Writing' },
    { to: '/tests', label: 'Listening & Reading' },
    { to: '/courses', label: 'Khóa học' },
    { to: '/speaking', label: 'Speaking' },
    { to: '/teacher', label: user?.role === 'Student' ? 'Giáo viên' : 'Học viên' },
  ];

  return (
    <div>
      <nav
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          overflowX: 'auto',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 20, whiteSpace: 'nowrap' }}>
          <img src={logo} alt="Whale English" style={{ height: 34, width: 34, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--primary)', lineHeight: 1.1 }}>
            Whale English
          </span>
        </span>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            })}
          >
            {item.label}
          </NavLink>
        ))}

        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
          {user?.role === 'Admin' && (
            <>
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: '#141826',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                🛡️ Khu vực quản trị
              </Link>
              <span style={{ width: 1, height: 22, background: 'var(--border)' }} />
            </>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.name}</span>
          <button onClick={logout} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
            Đăng xuất
          </button>
        </span>
      </nav>

      <div className="page">
        <Outlet />
      </div>
    </div>
  );
}
