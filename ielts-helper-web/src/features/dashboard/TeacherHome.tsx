import { useState, useEffect } from 'react';
import { FaBookOpen, FaCircleCheck, FaClipboardCheck, FaHeadphones, FaHourglassHalf, FaUsers } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/AuthContext';
import type { Student, ToGradeItem } from '@/types';
import QuickStat from './QuickStat';
import ActionCard from './ActionCard';
import { greeting } from './greeting';

export default function TeacherHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [toGrade, setToGrade] = useState<ToGradeItem[]>([]);

  useEffect(() => {
    async function load() {
      const [studentsRes, toGradeRes] = await Promise.all([
        apiClient.get<Student[]>('/api/TeacherLinks/my-students'),
        apiClient.get<ToGradeItem[]>('/api/Assignments/to-grade').catch(() => ({ data: [] as ToGradeItem[] })),
      ]);
      setStudents(studentsRes.data);
      setToGrade(toGradeRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="muted">Đang tải...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>{greeting()}, {user?.name}</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Tổng quan lớp học của bạn.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <QuickStat icon={<FaUsers />} label="Học viên đang theo dõi" value={students.length} color="var(--primary)" />
        <QuickStat
          icon={<FaHourglassHalf />}
          label="Bài chờ chấm"
          value={toGrade.length}
          color={toGrade.length > 0 ? 'var(--accent)' : 'var(--success)'}
        />
      </div>

      <h3>Truy cập nhanh</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <ActionCard to="/teacher" icon={<FaUsers />} title="Học viên của tôi" desc="Xem nhật ký học và lỗi sai từng học viên" color="#6366F1" />
        <ActionCard to="/assignments" icon={<FaClipboardCheck />} title={`Chấm bài (${toGrade.length})`} desc="Bài học viên đã nộp, đang chờ chấm" color="#FB7A3C" />
        <ActionCard to="/courses" icon={<FaBookOpen />} title="Khóa học" desc="Tạo khoá học và thêm bài giảng" color="#16A34A" />
        <ActionCard to="/tests" icon={<FaHeadphones />} title="Đề Listening & Reading" desc="Xem và luyện thử các đề đã tạo" color="#0EA5E9" />
      </div>

      <h3>Bài đang chờ chấm</h3>
      {toGrade.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}><FaCircleCheck className="ico" style={{ color: 'var(--success)' }} />Không có bài nào đang chờ chấm — mọi thứ đã xong!</p>
        </div>
      ) : (
        <div>
          {toGrade.slice(0, 5).map((item) => (
            <Link key={item.id} to="/assignments" className="list-item clickable" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{item.title}</strong>
                  <span className="badge badge-primary" style={{ marginLeft: 10 }}>{item.skill}</span>
                </div>
                <span className="muted">{new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <p className="muted" style={{ margin: '8px 0 0' }}>Học viên: {item.studentName}</p>
            </Link>
          ))}
          {toGrade.length > 5 && (
            <Link to="/assignments" className="muted" style={{ fontSize: 14 }}>
              Xem tất cả {toGrade.length} bài →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
