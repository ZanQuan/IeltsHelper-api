import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from './useAuth';
import WhaleMascot from '@/components/WhaleMascot/WhaleMascot';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch {
      setError('Đăng ký thất bại — email có thể đã được dùng.');
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    setError('');
    try {
      if (!response.credential) throw new Error('Thiếu credential');
      await loginWithGoogle(response.credential);
      navigate('/dashboard');
    } catch {
      setError('Đăng ký bằng Google thất bại.');
    }
  }

  return (
    <div className="center-screen">
      <div className="card w-360">
        <WhaleMascot email={email} isPasswordFocused={passwordFocused} />
        <h1 className="fs-26 text-center">Đăng ký</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Tên</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mật khẩu</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full">Đăng ký</button>
        </form>
        <div className="divider-row">
          <div className="divider-line" />
          <span className="muted fs-12">hoặc</span>
          <div className="divider-line" />
        </div>
        <div className="row-justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng ký bằng Google thất bại.')} />
        </div>
        <p className="muted mt-16 text-center">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}