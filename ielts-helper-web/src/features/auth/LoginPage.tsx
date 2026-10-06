import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from './useAuth';
import WhaleMascot from '@/components/WhaleMascot/WhaleMascot';
import './auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const expired = useSearchParams()[0].get('expired') === '1';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email hoặc mật khẩu không đúng.');
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    setError('');
    try {
      if (!response.credential) throw new Error('Thiếu credential');
      await loginWithGoogle(response.credential);
      navigate('/dashboard');
    } catch {
      setError('Đăng nhập bằng Google thất bại.');
    }
  }

  return (
    <div className="center-screen">
      <div className="card w-360">
        <WhaleMascot email={email} isPasswordFocused={passwordFocused} />
        <h1 className="fs-26 text-center">Đăng nhập</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mật khẩu</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required />
          </div>
          <p className="auth-forgot-row">
            <Link className="fs-13" to="/forgot-password">Quên mật khẩu?</Link>
          </p>
          {expired && !error && (
            <p className="error-text">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</p>
          )}
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full">Đăng nhập</button>
        </form>
        <div className="divider-row">
          <div className="divider-line" />
          <span className="muted fs-12">hoặc</span>
          <div className="divider-line" />
        </div>
        <div className="row-justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng nhập bằng Google thất bại.')} />
        </div>
        <p className="muted mt-16 text-center">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}