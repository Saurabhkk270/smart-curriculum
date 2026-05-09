import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p>Unable to load profile</p>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
    );
  }

  // Redirect to first section based on role
  const isTeacher = profile.role === 'teacher' || profile.role === 'admin';
  const defaultPath = isTeacher ? '/dashboard/classes' : '/dashboard/scanner';
  
  return <Navigate to={defaultPath} replace />;
};

export default Dashboard;
