import { type ReactNode } from 'react';

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
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16, color, display: 'inline-flex' }}>{icon}</span>
          <span className="label" style={{ margin: 0 }}>{label}</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
      </div>
    </div>
  );
}
