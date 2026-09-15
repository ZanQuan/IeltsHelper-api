import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    setError('');
    try {
      if (!response.credential) throw new Error('Thiếu credential');
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch {
      setError('Đăng nhập bằng Google thất bại.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div className="card" style={{ width: 360 }}>
        <img src={logo} alt="Whale English" style={{ height: 64, width: 64, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />
        <h1 style={{ fontSize: 26, textAlign: 'center' }}>Đăng nhập</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mật khẩu</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <p style={{ textAlign: 'right', margin: '-8px 0 12px' }}>
            <Link to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
          </p>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Đăng nhập</button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span className="muted" style={{ fontSize: 12 }}>hoặc</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng nhập bằng Google thất bại.')} />
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}