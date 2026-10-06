import { useState, useEffect } from 'react';
import { FaBook, FaCalendarDays, FaClipboardList, FaHeadphones, FaMicrophone, FaPenNib, FaPenToSquare } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import type { Assignment, LessonLog, SpeakingSubmission, Vocabulary, WritingSubmission } from '@/types';
import QuickStat from './QuickStat';
import ActionCard from './ActionCard';
import { greeting } from './greeting';
import './dashboard.css';

export default function StudentHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [latestWriting, setLatestWriting] = useState<WritingSubmission | null>(null);
  const [latestSpeaking, setLatestSpeaking] = useState<SpeakingSubmission | null>(null);

  useEffect(() => {
    async function load() {
      const [logsRes, dueRes, assignRes, writingRes, speakingRes] = await Promise.all([
        apiClient.get<LessonLog[]>('/api/LessonLogs'),
        apiClient.get<Vocabulary[]>('/api/Vocabularies/due'),
        apiClient.get<Assignment[]>('/api/Assignments').catch(() => ({ data: [] as Assignment[] })),
        apiClient.get<WritingSubmission[]>('/api/WritingSubmissions').catch(() => ({ data: [] as WritingSubmission[] })),
        apiClient.get<SpeakingSubmission[]>('/api/SpeakingSubmissions').catch(() => ({ data: [] as SpeakingSubmission[] })),
      ]);
      setLogs(logsRes.data.slice(0, 3));
      setDueCount(dueRes.data.length);
      setAssignments(assignRes.data);
      setLatestWriting(writingRes.data[0] ?? null);
      setLatestSpeaking(speakingRes.data[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const pendingAssignments = assignments.filter((a) => !a.submittedAt);
  const overdueCount = pendingAssignments.filter((a) => a.dueDate && new Date(a.dueDate) < new Date()).length;

  if (loading) return <p className="muted">Đang tải...</p>;

  return (
    <div>
      <h2 className="mb-2">{greeting()}, {user?.name}</h2>
      <p className="muted mb-24">Đây là những gì đang chờ bạn hôm nay.</p>

      <div className="card-grid-180">
        <QuickStat icon={<FaBook />} label="Từ vựng cần ôn" value={dueCount} color="var(--primary)" />
        <QuickStat
          icon={<FaClipboardList />}
          label="Bài tập chưa nộp"
          value={overdueCount > 0 ? `${pendingAssignments.length} (${overdueCount} quá hạn)` : pendingAssignments.length}
          color={overdueCount > 0 ? 'var(--danger)' : 'var(--accent)'}
        />
        <QuickStat icon={<FaCalendarDays />} label="Buổi học đã ghi" value={logs.length > 0 ? logs.length : 0} color="var(--success)" />
        <QuickStat
          icon={<FaPenNib />}
          label="Band Writing gần nhất"
          value={latestWriting?.estimatedBand ?? '—'}
          color="var(--primary)"
        />
      </div>

      <h3>Việc cần làm</h3>
      <div className="card-grid-240">
        <ActionCard to="/lessons" icon={<FaPenToSquare />} title="Ghi buổi học hôm nay" desc="Lưu lại nội dung vừa học với giáo viên" color="#6366F1" />
        <ActionCard to="/vocabulary" icon={<FaBook />} title={`Ôn từ vựng (${dueCount})`} desc="Ôn theo lịch giãn cách thông minh" color="#4F46E5" />
        <ActionCard to="/assignments" icon={<FaClipboardList />} title="Bài tập được giao" desc={`${pendingAssignments.length} bài chưa nộp`} color="#FB7A3C" />
        <ActionCard to="/writing" icon={<FaPenNib />} title="Luyện Writing" desc="Nộp bài, AI chấm band ngay lập tức" color="#0EA5E9" />
        <ActionCard to="/speaking" icon={<FaMicrophone />} title="Luyện Speaking" desc="Ghi âm, AI chuyển văn bản và chấm điểm" color="#F43F5E" />
        <ActionCard to="/tests" icon={<FaHeadphones />} title="Đề Listening & Reading" desc="Luyện đề có tính giờ, chấm tự động" color="#16A34A" />
      </div>

      {(latestWriting || latestSpeaking) && (
        <>
          <h3>Điểm gần nhất</h3>
          <div className="dash-grid-220">
            {latestWriting && (
              <div className="list-item">
                <span className="badge badge-primary">Writing · {latestWriting.taskType}</span>
                <div className="band-score fs-26 mt-8">
                  {latestWriting.estimatedBand ?? '—'}
                </div>
                <span className="muted">{new Date(latestWriting.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {latestSpeaking && (
              <div className="list-item">
                <span className="badge badge-accent">Speaking · {latestSpeaking.partType}</span>
                <div className="band-score fs-26 mt-8">
                  {latestSpeaking.estimatedBand ?? '—'}
                </div>
                <span className="muted">{new Date(latestSpeaking.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </>
      )}

      <h3>Buổi học gần đây</h3>
      {logs.length === 0 ? (
        <div className="card">
          <p className="muted m-0">
            Chưa có buổi học nào. <Link to="/lessons">Ghi buổi học đầu tiên →</Link>
          </p>
        </div>
      ) : (
        <div>
          {logs.map((log) => (
            <div key={log.id} className="list-item">
              <div className="row-between">
                <div>
                  <strong>{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</strong>
                  <span className="badge badge-primary ml-10">{log.skillFocus}</span>
                </div>
                <span className="badge badge-success">Hiểu bài: {log.selfRating}/5</span>
              </div>
              <p className="m-10-0-0">{log.summary}</p>
            </div>
          ))}
          <Link to="/lessons" className="muted fs-14">Xem tất cả buổi học →</Link>
        </div>
      )}
    </div>
  );
}
