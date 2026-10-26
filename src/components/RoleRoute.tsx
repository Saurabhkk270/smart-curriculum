import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

type Role = 'student' | 'teacher' | 'admin';

interface RoleRouteProps {
  allow: Role[];
  children: React.ReactNode;
}

const defaultPathForRole = (role?: Role) => {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/dashboard/classes';
  return '/dashboard/scanner';
};

export const RoleRoute = ({ allow, children }: RoleRouteProps) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center">Loading...</div>;
  }

  const role = profile?.role || 'student';

  if (!allow.includes(role)) {
    return <Navigate to={defaultPathForRole(role)} replace />;
  }

  return <>{children}</>;
};
