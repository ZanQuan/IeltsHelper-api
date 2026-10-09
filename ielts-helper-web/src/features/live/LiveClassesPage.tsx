import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import { LIVE_CLASSES_CHANGED } from '@/components/layout/LiveClassNotifier';
import { EARLY_JOIN_MS, getLiveStatus, type LiveClass, type LiveClassesResponse } from '@/types/liveclass';

interface CourseOption { id: string; title: string; }

function fmt(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LiveClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === 'Teacher' || user?.role === 'Admin';

  const [items, setItems] = useState<LiveClass[]>([]);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<LiveClassesResponse>('/api/LiveClasses/mine');
      setOffset(Date.parse(res.data.serverNow) - Date.now());
      setItems(res.data.items);
    } catch {
      setError('Không tải được danh sách lớp học.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!canCreate) return;
    apiClient.get<CourseOption[]>('/api/LiveClasses/my-courses').then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) setCourseId((cur) => cur || res.data[0].id);
    });
  }, [canCreate]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!courseId) return setFormError('Hãy chọn khóa học.');
    if (!startAt) return setFormError('Hãy chọn thời gian bắt đầu.');
    setCreating(true);
    try {
      await apiClient.post('/api/LiveClasses', {
        courseId, title, description,
        scheduledAt: new Date(startAt).toISOString(),
        durationMinutes: duration,
      });
      setTitle(''); setDescription(''); setStartAt('');
      await load();
      window.dispatchEvent(new Event(LIVE_CLASSES_CHANGED));
    } catch (err) {
      setFormError(axios.isAxiosError(err) ? err.response?.data?.error || 'Tạo lớp thất bại.' : 'Tạo lớp thất bại.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(c: LiveClass) {
    if (!window.confirm(`Xóa lớp "${c.title}"?`)) return;
    await apiClient.delete(`/api/LiveClasses/${c.id}`);
    await load();
    window.dispatchEvent(new Event(LIVE_CLASSES_CHANGED));
  }

  const serverNow = now + offset;
  const upcoming = items.filter((c) => getLiveStatus(c, serverNow) !== 'ended');
  const ended = items.filter((c) => getLiveStatus(c, serverNow) === 'ended').reverse();

  function renderItem(c: LiveClass) {
    const status = getLiveStatus(c, serverNow);
    const canJoin = c.canManage
      ? status !== 'ended'
      : status === 'live' || (status === 'upcoming' && Date.parse(c.scheduledAt) - serverNow <= EARLY_JOIN_MS);
    return (
      <div key={c.id} className="list-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <strong style={{ fontSize: 16 }}>{c.title}</strong>{' '}
            {status === 'live' && <span className="badge badge-success">Đang diễn ra</span>}
            {status === 'upcoming' && <span className="badge badge-primary">Sắp diễn ra</span>}
            {status === 'ended' && <span className="badge">Đã kết thúc</span>}
            <p className="muted" style={{ margin: '4px 0 0' }}>{fmt(c.scheduledAt)} · {c.durationMinutes} phút</p>
            <p className="muted" style={{ margin: 0 }}>{c.courseTitle} · GV {c.teacherName}</p>
            {c.description && <p style={{ margin: '6px 0 0', fontSize: 14 }}>{c.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canJoin && (
              <button className="btn btn-primary" onClick={() => navigate(`/live-classes/${c.id}`)}>
                {c.canManage && status === 'upcoming' ? 'Mở phòng' : 'Vào lớp'}
              </button>
            )}
            {c.canManage && <button className="btn btn-danger-soft" onClick={() => handleDelete(c)}>Xóa</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Lớp học trực tuyến</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Đến giờ học, hệ thống sẽ hiện thông báo cho giáo viên và học viên. Bấm vào thông báo để vào lớp.
      </p>

      {canCreate && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 28 }}>
          <h3>Tạo lớp học mới</h3>
          <label className="label">Khóa học</label>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            {courses.length === 0 && <option value="">Chưa có khóa học</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          <label className="label" style={{ marginTop: 12 }}>Tên lớp học</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Luyện Speaking Part 2" required />

          <label className="label" style={{ marginTop: 12 }}>Ghi chú (tuỳ chọn)</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="label">Bắt đầu lúc</label>
              <input className="input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">Thời lượng (phút)</label>
              <input className="input" type="number" min={15} max={240} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
            </div>
          </div>

          {formError && <p className="error-text">{formError}</p>}
          <button className="btn btn-primary" type="submit" disabled={creating || courses.length === 0} style={{ marginTop: 14 }}>
            {creating ? 'Đang tạo...' : 'Tạo lớp học'}
          </button>
        </form>
      )}

      {error && <p className="error-text">{error}</p>}
      {loading ? <p className="muted">Đang tải...</p> : (
        <>
          <h3>Lịch học</h3>
          {upcoming.length === 0 ? <p className="muted">Chưa có lớp nào sắp diễn ra.</p> : upcoming.map(renderItem)}
          {ended.length > 0 && (
            <>
              <h3 style={{ marginTop: 28 }}>Đã kết thúc gần đây</h3>
              {ended.map(renderItem)}
            </>
          )}
        </>
      )}
    </div>
  );
}