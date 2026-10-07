import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa6';
import type { NavGroup } from './navConfig';

interface Props {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function NavDropdown({ group, open, onToggle, onClose }: Props) {
  const { pathname } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const active = group.items.some((i) => pathname === i.to || pathname.startsWith(i.to + '/'));

  useEffect(() => {
    if (!open) return;
    const outside = (target: EventTarget | null) =>
      !!rootRef.current && !rootRef.current.contains(target as Node);

    const onMouseDown = (e: MouseEvent) => {
      if (outside(e.target)) onClose();
    };
    const onFocusIn = (e: FocusEvent) => {
      if (outside(e.target)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const panelId = `nav-panel-${group.id}`;

  return (
    <div className="topnav-group" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`topnav-group-btn${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
      >
        {group.label}
        <FaChevronDown className="topnav-chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul id={panelId} className="topnav-panel">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `topnav-panel-link${isActive ? ' is-active' : ''}`}
                onClick={onClose}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
