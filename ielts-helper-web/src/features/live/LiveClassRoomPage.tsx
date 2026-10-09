import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import type { LiveJoinInfo } from '@/types/liveclass';

const JITSI_DOMAIN: string = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

export default function LiveClassRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<LiveJoinInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<LiveJoinInfo>(`/api/LiveClasses/${id}/join`)
      .then((res) => setInfo(res.data))
      .catch((err) => setError(axios.isAxiosError(err)
        ? err.response?.data?.error || 'Không vào được lớp học.' : 'Không vào được lớp học.'));
  }, [id]);

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="error-text">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/live-classes')}>Về danh sách lớp</button>
      </div>
    );
  }
  if (!info) return <p className="muted">Đang vào lớp...</p>;

  const hash = [
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(user?.name ?? 'Học viên'))}`,
    `config.subject=${encodeURIComponent(JSON.stringify(info.title))}`,
    'config.prejoinPageEnabled=false',
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=true',
    'config.disableDeepLinking=true',
  ].join('&');
  const roomUrl = `https://${JITSI_DOMAIN}/${info.roomName}#${hash}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: '#111' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: 'var(--surface, #fff)', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 14 }} onClick={() => navigate('/live-classes')}>← Rời lớp</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{info.title}</strong>
          <span className="muted" style={{ marginLeft: 10 }}>GV {info.teacherName}</span>
        </div>
        <a className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} href={roomUrl} target="_blank" rel="noreferrer">Mở tab mới</a>
      </div>
      <iframe
        title={info.title}
        src={roomUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
        style={{ flex: 1, width: '100%', border: 0 }}
      />
    </div>
  );
}