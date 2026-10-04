import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import type { Assignment, Student, ToGradeItem } from '@/types';
import StatusBadge from './StatusBadge';
import { fmtDate } from './fmtDate';

const SKILLS = ['General', 'Writing', 'Speaking', 'Reading', 'Listening', 'Vocabulary'];

export default function TeacherAssignments() {
  const [students, setStudents] = useState<Student[]>([]);
  const [toGrade, setToGrade] = useState<ToGradeItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  // form giao bài mới
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [skill, setSkill] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // form chấm điểm
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');

  async function loadOverview() {
    setLoading(true);
    const [studentsRes, toGradeRes] = await Promise.all([
      apiClient.get<Student[]>('/api/TeacherLinks/my-students'),
      apiClient.get<ToGradeItem[]>('/api/Assignments/to-grade'),
    ]);
    setStudents(studentsRes.data);
    setToGrade(toGradeRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function openStudent(s: Student) {
    setSelectedStudent(s);
    setSelected(null);
    const res = await apiClient.get<Assignment[]>(`/api/Assignments?studentId=${s.id}`);
    setAssignments(res.data);
  }

  async function openAssignment(id: string) {
    const res = await apiClient.get<Assignment>(`/api/Assignments/${id}`);
    setSelected(res.data);
    setScore(res.data.score != null ? String(res.data.score) : '');
    setFeedback(res.data.feedback ?? '');
    setGradeError('');
    if (!selectedStudent) {
      const s = students.find((st) => st.id === res.data.studentId);
      if (s) setSelectedStudent(s);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setCreateError('');
    setCreating(true);
    try {
      await apiClient.post('/api/Assignments', {
        studentId: selectedStudent.id,
        title,
        instructions,
        skill,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setTitle('');
      setInstructions('');
      setSkill('General');
      setDueDate('');
      await openStudent(selectedStudent);
      await loadOverview();
    } catch (err) {
      setCreateError(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Giao bài thất bại.' : 'Giao bài thất bại.');
    } finally {
      setCreating(false);
    }
  }

  async function handleGrade(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setGradeError('');
    setGrading(true);
    try {
      const res = await apiClient.post<Assignment>(`/api/Assignments/${selected.id}/grade`, {
        score: Number(score),
        feedback,
      });
      setSelected(res.data);
      if (selectedStudent) await openStudent(selectedStudent);
      await loadOverview();
    } catch (err) {
      setGradeError(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Chấm điểm thất bại.' : 'Chấm điểm thất bại.');
    } finally {
      setGrading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bài tập này?')) return;
    await apiClient.delete(`/api/Assignments/${id}`);
    setSelected(null);
    if (selectedStudent) await openStudent(selectedStudent);
    await loadOverview();
  }

  function initials(name: string) {
    return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  }

  // Xem chi tiết 1 bài (chấm điểm)
  if (selected) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14, marginBottom: 16 }}>
          ← Quay lại
        </button>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 10 }}>{selected.skill}</span>
              <h2 style={{ margin: '8px 0 4px' }}>{selected.title}</h2>
              <p className="muted" style={{ margin: 0 }}>
                Học viên: {students.find((s) => s.id === selected.studentId)?.name ?? selectedStudent?.name}
              </p>
            </div>
            <StatusBadge assignment={selected} />
          </div>
          {selected.instructions && <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{selected.instructions}</p>}
          <button onClick={() => handleDelete(selected.id)} className="btn btn-ghost" style={{ marginTop: 16, color: 'var(--danger)', fontSize: 13, padding: '6px 14px' }}>
            Xóa bài tập
          </button>
        </div>

        {!selected.submittedAt ? (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Học viên chưa nộp bài này.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Bài làm của học viên</h3>
              <p className="muted" style={{ marginBottom: 10 }}>Nộp lúc: {new Date(selected.submittedAt).toLocaleString('vi-VN')}</p>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.answerText}</p>
            </div>

            <form onSubmit={handleGrade} className="card">
              <h3 style={{ marginTop: 0 }}>{selected.gradedAt ? 'Sửa điểm' : 'Chấm điểm'}</h3>
              <div className="field">
                <label className="label">Điểm (/10)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="label">Nhận xét</label>
                <textarea className="input" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              </div>
              {gradeError && <p className="error-text">{gradeError}</p>}
              <button type="submit" className="btn btn-primary" disabled={grading}>
                {grading ? 'Đang lưu...' : 'Lưu điểm'}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  // Xem danh sách bài tập của 1 học viên + form giao bài mới
  if (selectedStudent) {
    return (
      <div>
        <button onClick={() => setSelectedStudent(null)} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14, marginBottom: 16 }}>
          ← Quay lại danh sách học viên
        </button>

        <h2>Bài tập của {selectedStudent.name}</h2>

        <form onSubmit={handleCreate} className="card" style={{ margin: '20px 0 28px' }}>
          <h3 style={{ marginTop: 0 }}>Giao bài mới</h3>
          <div className="field">
            <label className="label">Tiêu đề</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="VD: Viết Writing Task 2 chủ đề môi trường" />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Kỹ năng</label>
              <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
                {SKILLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Hạn nộp (không bắt buộc)</label>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Hướng dẫn / đề bài</label>
            <textarea className="input" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Mô tả chi tiết bài tập..." />
          </div>
          {createError && <p className="error-text">{createError}</p>}
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Đang giao...' : 'Giao bài tập'}
          </button>
        </form>

        {assignments.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Chưa giao bài tập nào cho học viên này.</p>
          </div>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="list-item clickable" onClick={() => openAssignment(a.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <span className="badge badge-primary" style={{ marginRight: 8 }}>{a.skill}</span>
                  <strong>{a.title}</strong>
                  {a.dueDate && <p className="muted" style={{ margin: '6px 0 0' }}>Hạn nộp: {fmtDate(a.dueDate)}</p>}
                </div>
                <StatusBadge assignment={a} />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Tổng quan: cần chấm + danh sách học viên
  return (
    <div>
      <h2>Bài tập</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Giao bài tập cho học viên và chấm điểm bài đã nộp.</p>

      {!loading && toGrade.length > 0 && (
        <>
          <h3>Cần chấm ({toGrade.length})</h3>
          <div style={{ marginBottom: 28 }}>
            {toGrade.map((t) => (
              <div key={t.id} className="list-item clickable" onClick={() => openAssignment(t.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <span className="badge badge-accent" style={{ marginRight: 8 }}>{t.skill}</span>
                    <strong>{t.title}</strong>
                    <p className="muted" style={{ margin: '6px 0 0' }}>{t.studentName}</p>
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>Nộp lúc {new Date(t.submittedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3>Học viên</h3>
      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : students.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Chưa có học viên nào liên kết với bạn. Bảo học viên vào mục "Giáo viên" trong tài khoản của họ và nhập email của bạn.
          </p>
        </div>
      ) : (
        students.map((s) => (
          <div key={s.id} className="list-item clickable" onClick={() => openStudent(s)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {initials(s.name)}
              </span>
              <div>
                <strong>{s.name}</strong>
                <p className="muted" style={{ margin: 0 }}>{s.email}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
