import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import { useAuth } from '@/features/auth/useAuth';
import './settings.css';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isGoogleLinked: boolean;
  phoneNumber: string | null;
  dateOfBirth: string | null; // yyyy-MM-dd
  targetBand: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface ProfileForm {
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  targetBand: string;
  bio: string;
  avatarUrl: string | null;
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

// Cắt vuông ở giữa và thu nhỏ ảnh về 256x256 (JPEG) để lưu gọn trong DB
async function resizeToSquare(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function errorText(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) return err.response?.data?.error || fallback;
  return fallback;
}

export default function SettingsPage() {
  const { updateName, updateAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState(false);

  const [showChangeForm, setShowChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [, setUploading] = useState(false);

  useEffect(() => {
    apiClient.get<Profile>('/api/Auth/me').then((res) => {
      const p = res.data;
      setProfile(p);
      setForm({
        name: p.name,
        phoneNumber: p.phoneNumber ?? '',
        dateOfBirth: p.dateOfBirth ?? '',
        targetBand: p.targetBand ?? '',
        bio: p.bio ?? '',
        avatarUrl: p.avatarUrl,
      });
      setLoading(false);
    });
  }, []);

  function setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handlePickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileErr(true);
      setProfileMsg('Vui lòng chọn một file ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileErr(true);
      setProfileMsg('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB.');
      return;
    }
    setUploading(true);
    setProfileMsg('');
    try {
      const dataUrl = await resizeToSquare(file);
      const blob = await (await fetch(dataUrl)).blob();
      const body = new FormData();
      body.append('File', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      body.append('FileName', 'avatar');
      body.append('FileDescription', 'Ảnh đại diện');
      const res = await apiClient.post<{ filePath: string }>('/api/Images/Upload', body);
      setField('avatarUrl', res.data.filePath);
    } catch (err) {
      setProfileErr(true);
      setProfileMsg(errorText(err, 'Tải ảnh lên thất bại.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setProfileMsg('');
    setProfileErr(false);

    if (form.name.trim().length < 2) {
      setProfileErr(true);
      setProfileMsg('Họ tên phải có ít nhất 2 ký tự.');
      return;
    }

    setSavingProfile(true);
    try {
      await apiClient.put('/api/Auth/me', {
        name: form.name,
        phoneNumber: form.phoneNumber || null,
        dateOfBirth: form.dateOfBirth || null,
        targetBand: form.targetBand || null,
        bio: form.bio || null,
        avatarUrl: form.avatarUrl,
      });
      updateName(form.name.trim());
      updateAvatar(form.avatarUrl);
      setProfile((prev) => (prev ? { ...prev, name: form.name.trim(), avatarUrl: form.avatarUrl } : prev));
      setProfileMsg('Đã lưu hồ sơ.');
    } catch (err) {
      setProfileErr(true);
      setProfileMsg(errorText(err, 'Lưu hồ sơ thất bại.'));
    } finally {
      setSavingProfile(false);
    }
  }

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
      setMessage(errorText(err, 'Đổi mật khẩu thất bại.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !profile || !form) return <p className="muted">Đang tải...</p>;

  return (
    <div className="settings-page">
      <h2>Hồ sơ cá nhân</h2>

      <form onSubmit={handleSaveProfile} className="card mb-24">
        <div className="settings-profile-head">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt="Ảnh đại diện"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <span className="settings-avatar">{initials(form.name || profile.name)}</span>
          )}
          <div>
            <div className="settings-name">{profile.name}</div>
            <span className={`badge ${ROLE_BADGE[profile.role] ?? 'badge-primary'}`}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => fileRef.current?.click()}>
                {form.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </button>
              {form.avatarUrl && (
                <button type="button" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setField('avatarUrl', null)}>
                  Xóa ảnh
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePickAvatar} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="field">
            <label className="label">Họ và tên</label>
            <input className="input" value={form.name} maxLength={100} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" value={profile.email} disabled />
            {profile.isGoogleLinked && <span className="badge badge-success" style={{ marginTop: 6 }}>Đã liên kết Google</span>}
          </div>
          <div className="field">
            <label className="label">Số điện thoại</label>
            <input className="input" value={form.phoneNumber} maxLength={20} onChange={(e) => setField('phoneNumber', e.target.value)} placeholder="vd: 0901234567" />
          </div>
          <div className="field">
            <label className="label">Ngày sinh</label>
            <input
              className="input"
              type="date"
              value={form.dateOfBirth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setField('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Band mục tiêu</label>
            <input className="input" value={form.targetBand} maxLength={20} onChange={(e) => setField('targetBand', e.target.value)} placeholder="vd: 6.5" />
          </div>
          <div className="field">
            <label className="label">Tham gia từ</label>
            <input className="input" value={new Date(profile.createdAt).toLocaleDateString('vi-VN')} disabled />
          </div>
        </div>

        <div className="field">
          <label className="label">Giới thiệu bản thân</label>
          <textarea className="input" rows={3} maxLength={500} value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
          <p className="muted" style={{ fontSize: 12, margin: '4px 0 0', textAlign: 'right' }}>{form.bio.length}/500</p>
        </div>

        {profileMsg && (
          <p style={{ fontSize: 14, color: profileErr ? 'var(--danger)' : 'var(--success)' }}>{profileMsg}</p>
        )}
        <button type="submit" disabled={savingProfile} className="btn btn-primary">
          {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </form>

      <div className="card mb-24">
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