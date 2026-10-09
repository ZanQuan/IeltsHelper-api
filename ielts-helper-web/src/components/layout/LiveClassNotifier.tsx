import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import {getLiveStatus,type LiveClass,type LiveClassesResponse} from '@/types/liveclass';

export const LIVE_CLASSES_CHANGED = 'live-classes:changed';

export default function LiveClassNotifier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LiveClass[]>([]);
  const [toast, setToast] = useState<LiveClass | null>(null);
  const offsetRef = useRef(0);
  const userId = user?.userId;

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<LiveClassesResponse>('/api/LiveClasses/mine');
      offsetRef.current = Date.parse(res.data.serverNow) - Date.now();
      setItems(res.data.items);
    } catch { /* thử lại lần sau */ }
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
    const t = setInterval(load, 60_000);
    window.addEventListener(LIVE_CLASSES_CHANGED, load);
    return () => { clearInterval(t); window.removeEventListener(LIVE_CLASSES_CHANGED, load); };
  }, [userId, load]);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    const ask = () => {
      Notification.requestPermission().catch(() => undefined);
      window.removeEventListener('click', ask);
    };
    window.addEventListener('click', ask);
    return () => window.removeEventListener('click', ask);
  }, []);

  const goToClass = useCallback((id: string) => {
    setToast(null);
    navigate(`/live-classes/${id}`);
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const check = () => {
      const now = Date.now() + offsetRef.current;
      for (const c of items) {
        if (getLiveStatus(c, now) !== 'live') continue;
        const key = `live-notified:${userId}:${c.id}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, '1');

        setToast(c);
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification('Bạn có một lớp học ngay bây giờ!', {
            body: `${c.title} · ${c.courseTitle}`,
            tag: c.id,
            requireInteraction: true,
            icon: '/logo.png',
          });
          n.onclick = () => { window.focus(); goToClass(c.id); n.close(); };
        }
        break;
      }
    };
    check();
    const t = setInterval(check, 5_000);
    return () => clearInterval(t);
  }, [items, userId, goToClass]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      onClick={() => goToClass(toast.id)}
      style={{
        position: 'fixed', top: 80, right: 20, zIndex: 300, width: 340, maxWidth: 'calc(100vw - 40px)',
        background: 'var(--surface, #fff)', borderRadius: 16, padding: 18, cursor: 'pointer',
        border: '1px solid var(--primary)', boxShadow: '0 12px 32px rgba(79,70,229,.28)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <strong style={{ fontSize: 16, color: 'var(--primary)' }}>🔔 Bạn có một lớp học ngay bây giờ!</strong>
        <button
          aria-label="Đóng thông báo"
          onClick={(e) => { e.stopPropagation(); setToast(null); }}
          style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}
        >✕</button>
      </div>
      <p style={{ margin: '8px 0 2px', fontWeight: 700 }}>{toast.title}</p>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
        {toast.courseTitle} · GV {toast.teacherName}
      </p>
      <button className="btn btn-primary" style={{ width: '100%' }}
        onClick={(e) => { e.stopPropagation(); goToClass(toast.id); }}>
        Vào lớp
      </button>
    </div>
  );
}