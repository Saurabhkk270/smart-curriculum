import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigError } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors';
import { useNavigate } from 'react-router-dom';

type Profile = Tables<'profiles'>;
type UserRole = Profile['role'];

export const DEMO_STUDENT_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: {
    full_name: 'Rahul Sharma',
    role: 'student',
    student_id: '2026-CSE-001',
    course: 'B.Tech CSE',
    semester: 'Semester 5',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'student.preview@svsu.ac.in',
} as unknown as User;

export const DEMO_STUDENT_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student.preview@svsu.ac.in',
  full_name: 'Rahul Sharma',
  student_id: '2026-CSE-001',
  roll_no: '2301042',
  role: 'student',
  account_status: 'active',
  branch: 'Computer Science & Engineering',
  course: 'B.Tech CSE',
  semester: 'Semester 5',
  section: 'A',
  admission_year: 2024,
  phone_number: '+91 9876543210',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsStudentPreview: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: DEMO_STUDENT_USER,
  session: null,
  profile: DEMO_STUDENT_PROFILE,
  loading: false,
  authError: null,
  refreshProfile: async () => {},
  signOut: async () => {},
  loginAsStudentPreview: () => {},
});

export const useAuth = () => useContext(AuthContext);

const getMetadataString = (user: User, key: string) => {
  const value = user.user_metadata?.[key];
  return typeof value === 'string' ? value : '';
};

const getMetadataRole = (user: User): UserRole => {
  const role = getMetadataString(user, 'role');
  return role === 'teacher' || role === 'admin' ? role : 'student';
};

const createProfileFromUser = (user: User): Profile => ({
  id: user.id,
  email: user.email || '',
  full_name: getMetadataString(user, 'full_name') || user.email || 'User',
  student_id: getMetadataString(user, 'student_id') || null,
  roll_no: null,
  account_status: 'active',
  branch: null,
  section: null,
  admission_year: null,
  phone_number: null,
  role: getMetadataRole(user),
  course: getMetadataString(user, 'course') || null,
  semester: getMetadataString(user, 'semester') || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Direct default preview into student without requiring login!
  const [user, setUser] = useState<User | null>(DEMO_STUDENT_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(DEMO_STUDENT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async (activeUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setAuthError(null);
        return;
      }

      const fallbackProfile = createProfileFromUser(activeUser);

      if (error) {
        setProfile(fallbackProfile);
        setAuthError(getSupabaseErrorMessage(error, 'Unable to load your profile.'));
        return;
      }

      const { data: repairedProfile } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select('*')
        .single();

      if (repairedProfile) {
        setProfile(repairedProfile);
        setAuthError(null);
      } else {
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setProfile(createProfileFromUser(activeUser));
      setAuthError(getSupabaseErrorMessage(err, 'Unable to connect to the attendance database.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          setTimeout(() => {
            fetchProfile(currentSession.user);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // If explicit sign out, clear to null so user can sign into another account
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          // Default to student preview
          setUser(DEMO_STUDENT_USER);
          setProfile(DEMO_STUDENT_PROFILE);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        setUser(existingSession.user);
        fetchProfile(existingSession.user);
      } else {
        // Default to student preview
        setUser(DEMO_STUDENT_USER);
        setProfile(DEMO_STUDENT_PROFILE);
        setLoading(false);
      }
    }).catch(() => {
      // In offline or preview mode, keep default student
      setUser(DEMO_STUDENT_USER);
      setProfile(DEMO_STUDENT_PROFILE);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = async () => {
    if (user && user.id !== DEMO_STUDENT_USER.id) {
      await fetchProfile(user);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    navigate('/auth');
  };

  const loginAsStudentPreview = () => {
    setUser(DEMO_STUDENT_USER);
    setProfile(DEMO_STUDENT_PROFILE);
    setAuthError(null);
    navigate('/dashboard/scanner');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, authError, refreshProfile, signOut, loginAsStudentPreview }}>
      {children}
    </AuthContext.Provider>
  );
};
