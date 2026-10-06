import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './dashboard.css';

export default function ActionCard({
  to,
  icon,
  title,
  desc,
  color,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="card action-card"
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 19,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <strong className="fs-15">{title}</strong>
        <p className="muted action-card-desc">{desc}</p>
      </div>
    </Link>
  );
}
