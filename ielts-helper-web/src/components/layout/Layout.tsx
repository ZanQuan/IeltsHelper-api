import { useCallback, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FaBars, FaShieldHalved, FaXmark } from 'react-icons/fa6';
import { useAuth } from '@/features/auth/useAuth';
import logo from '@/assets/logo.png';
import NavDropdown from './NavDropdown';
import { HOME_ITEM, buildNavGroups } from './navConfig';
import './layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const groups = buildNavGroups(user?.role);

  const [openGroup, setOpenGroup] = useState<string | null>(null); // nhóm đang xổ xuống
  const [menuOpen, setMenuOpen] = useState(false); // menu trên màn hình hẹp (nút ☰)

  // Chuyển sang trang khác thì tự đóng mọi menu (cập nhật ngay lúc render, không cần useEffect)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpenGroup(null);
    setMenuOpen(false);
  }

  const closeGroup = useCallback(() => setOpenGroup(null), []);

  return (
    <div>
      <nav className="topnav" aria-label="Menu chính">
        <Link className="topnav-brand" to="/">
          <img className="topnav-logo" src={logo} alt="Whale English" />
          <span className="topnav-brand-name">Whale English</span>
        </Link>

        <button
          type="button"
          className="topnav-burger"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="topnav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <FaXmark /> : <FaBars />}
        </button>

        <div id="topnav-menu" className={`topnav-menu${menuOpen ? ' is-open' : ''}`}>
          <NavLink
            to={HOME_ITEM.to}
            end
            className={({ isActive }) => `topnav-link${isActive ? ' is-active' : ''}`}
          >
            {HOME_ITEM.label}
          </NavLink>

          {groups.map((group) => (
            <NavDropdown
              key={group.id}
              group={group}
              open={openGroup === group.id}
              onToggle={() => setOpenGroup(openGroup === group.id ? null : group.id)}
              onClose={closeGroup}
            />
          ))}

          <span className="topnav-actions">
            {user?.role === 'Admin' && (
              <>
                <Link className="topnav-admin-link" to="/admin">
                  <FaShieldHalved className="ico" />
                  Khu vực quản trị
                </Link>
                <span className="topnav-divider" />
              </>
            )}
            <Link className="topnav-user" to="/settings" title={user?.name}>
              {user?.name}
            </Link>
            <button onClick={logout} className="btn btn-ghost topnav-logout-btn">
              Đăng xuất
            </button>
          </span>
        </div>
      </nav>

      <div className="page">
        <Outlet />
      </div>
    </div>
  );
}
