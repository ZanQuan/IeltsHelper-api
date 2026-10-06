import { type ReactNode } from 'react';
import './dashboard.css';

export default function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card card-flush">
      <div style={{ height: 4, background: color }} />
      <div className="p-16-18">
        <div className="row-center-8-mb-6">
          <span style={{ fontSize: 16, color, display: 'inline-flex' }}>{icon}</span>
          <span className="label m-0">{label}</span>
        </div>
        <div className="quick-stat-value">{value}</div>
      </div>
    </div>
  );
}
