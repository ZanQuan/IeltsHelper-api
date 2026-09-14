import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #ddd', alignItems: 'center' }}>
        <NavLink to="/">Trang chủ</NavLink>
        <NavLink to="/lessons">Buổi học</NavLink>
        <NavLink to="/vocabulary">Từ vựng</NavLink>
        <NavLink to="/errors">Lỗi sai</NavLink>
        <NavLink to="/writing">Writing</NavLink>
        <span style={{ marginLeft: 'auto' }}>Xin chào, {user?.name}</span>
        <button onClick={logout}>Đăng xuất</button>
      </nav>
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}