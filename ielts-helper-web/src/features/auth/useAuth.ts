import { useContext } from 'react';
import { AuthContext } from './AuthContext';


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phai dung ben trong AuthProvider');
  return context;
}
