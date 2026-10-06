import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import './settings.css';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isGoogleLinked: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  Student: 'Học viên',
  Teacher: 'Giáo viên',
  Admin: 'Quản trị viên',
};

const ROLE_BADGE: Record<string, string> = {
  Student: 'badge-primary',
  Teacher: 'badge-accent',
  Admin: 'badge-success',
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showChangeForm, setShowChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    apiClient.get<Profile>('/api/Auth/me').then((res) => {
      setProfile(res.data);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('Xác nhận mật khẩu không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/Auth/change-password', { currentPassword, newPassword });
      setMessage(res.data.message);
      setIsError(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangeForm(false), 1200);
    } catch (err) {
      setIsError(true);
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.error || 'Đổi mật khẩu thất bại.');
      } else {
        setMessage('Đổi mật khẩu thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !profile) return <p className="muted">Đang tải...</p>;

  return (
    <div className="settings-page">
      <h2>Tài khoản của tôi</h2>

      <div className="card mb-24">
        <div className="settings-profile-head">
          <span className="settings-avatar">
            {initials(profile.name)}
          </span>
          <div>
            <div className="settings-name">{profile.name}</div>
            <span className={`badge ${ROLE_BADGE[profile.role] ?? 'badge-primary'}`}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
          </div>
        </div>

        <div className="settings-field-grid">
          <div>
            <p className="label mb-3">Email</p>
            <p className="m-0">
              {profile.email}
              {profile.isGoogleLinked && (
                <span className="badge badge-success ml-8">Đã liên kết Google</span>
              )}
            </p>
          </div>

          <div>
            <p className="label mb-3">Tham gia từ</p>
            <p className="m-0">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>

          <div>
            <p className="label mb-3">Mật khẩu</p>
            <div className="settings-password-row">
              <span className="settings-password-dots">••••••••</span>
              <button
                type="button"
                onClick={() => { setShowChangeForm((v) => !v); setMessage(''); }}
                className="btn btn-ghost settings-toggle-btn"
              >
                {showChangeForm ? 'Đóng' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showChangeForm && (
        <form onSubmit={handleSubmit} className="card">
          <h3>Đổi mật khẩu</h3>
          <div className="field">
            <label className="label">Mật khẩu hiện tại</label>
            <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mật khẩu mới</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Xác nhận mật khẩu mới</label>
            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {message && <p style={{ fontSize: 14, color: isError ? 'var(--danger)' : 'var(--success)' }}>{message}</p>}
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
          {profile.isGoogleLinked && (
            <p className="muted settings-hint">
              Nếu bạn chưa từng đặt mật khẩu (chỉ đăng nhập bằng Google), dùng{' '}
              <a href="/forgot-password">quên mật khẩu</a> để thiết lập lần đầu thay vì đổi ở đây.
            </p>
          )}
        </form>
      )}
    </div>
  );
}