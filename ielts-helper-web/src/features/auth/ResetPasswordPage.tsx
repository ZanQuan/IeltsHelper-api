import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import logo from '@/assets/logo.png';
import './auth.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/Auth/reset-password', { email, token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error ?? 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  if (!email || !token) {
    return (
      <div className="center-screen">
        <div className="card auth-card-message">
          <p className="error-text">Liên kết không hợp lệ hoặc đã thiếu thông tin.</p>
          <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="card w-360">
        <img className="logo-64" src={logo} alt="Whale English" />
        <h1 className="fs-24 text-center">Đặt lại mật khẩu</h1>
        {done ? (
          <p className="auth-success-center">
            Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Mật khẩu mới</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label className="label">Nhập lại mật khẩu mới</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
