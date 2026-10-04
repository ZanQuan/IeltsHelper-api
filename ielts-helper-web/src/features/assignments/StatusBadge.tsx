import type { Assignment } from '@/types';

export default function StatusBadge({ assignment: a }: { assignment: Assignment }) {
  if (a.gradedAt) return <span className="badge badge-success">Đã chấm: {a.score}/10</span>;
  if (a.submittedAt) return <span className="badge badge-primary">Đã nộp — chờ chấm</span>;
  const overdue = a.dueDate && new Date(a.dueDate) < new Date();
  return <span className="badge badge-accent">{overdue ? 'Quá hạn — chưa nộp' : 'Chưa nộp'}</span>;
}
