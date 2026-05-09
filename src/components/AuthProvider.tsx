import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigError } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors';
import { useNavigate } from 'react-router-dom';

type Profile = Tables<'profiles'>;
type UserRole = Profile['role'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  authError: null,
  refreshProfile: async () => {},
  signOut: async () => {},
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
  role: getMetadataRole(user),
  course: getMetadataString(user, 'course') || null,
  semester: getMetadataString(user, 'semester') || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(supabaseConfigError);
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
        setAuthError(supabaseConfigError);
        return;
      }

      const fallbackProfile = createProfileFromUser(activeUser);

      if (error) {
        setProfile(fallbackProfile);
        setAuthError(getSupabaseErrorMessage(error, 'Unable to load your profile.'));
        return;
      }

      const { data: repairedProfile, error: repairError } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select('*')
        .single();

      if (repairedProfile) {
        setProfile(repairedProfile);
        setAuthError(null);
      } else {
        setProfile(fallbackProfile);
        setAuthError(
          getSupabaseErrorMessage(
            repairError,
            'Your account exists, but the profile row could not be created. Please ask an admin to apply the latest Supabase migrations.',
          ),
        );
      }
    } catch (err) {
      setProfile(createProfileFromUser(activeUser));
      setAuthError(getSupabaseErrorMessage(err, 'Unable to connect to the attendance database.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user);
          }, 0);
        } else {
          setProfile(null);
          setAuthError(supabaseConfigError);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      setAuthError(getSupabaseErrorMessage(err, 'Unable to restore your login session.'));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, authError, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
