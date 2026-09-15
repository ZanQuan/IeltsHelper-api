import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import logo from '../assets/logo.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await apiClient.post('/api/Auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div className="card" style={{ width: 360 }}>
        <img src={logo} alt="Whale English" style={{ height: 64, width: 64, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
        <h1 style={{ fontSize: 24, textAlign: 'center' }}>Quên mật khẩu</h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!message}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: 'var(--success)', fontSize: 14 }}>{message}</p>}
          {!message && (
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          )}
        </form>
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
