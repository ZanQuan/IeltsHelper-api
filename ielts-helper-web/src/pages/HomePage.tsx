import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Xin chào, {user?.name}!</h2>
      <p>Vai trò: {user?.role}</p>
    </div>
  );
}