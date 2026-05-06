import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  code: string;
}

const fetchTeacherClasses = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, code')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ClassItem[];
};

const Classes = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Classes | SVSU Attendance APP';
  }, []);

  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: () => fetchTeacherClasses(profile!.id),
    enabled: !!profile?.id,
  });

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Only teachers can access Classes.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Classes</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Select a class to view details</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="flex-shrink-0 pointer-events-auto hover:bg-primary hover:text-primary-foreground transition-all">Back</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))] p-8 text-white shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">Your Classes</h2>
              <p className="text-white/95 drop-shadow">Manage students, assignments, and attendance for each class</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && (
              <Card className="shadow-[var(--shadow-large)] border-2 border-primary/20 animate-fade-in">
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                  <CardDescription>Please wait</CardDescription>
                </CardHeader>
              </Card>
            )}

            {error && (
              <Card className="shadow-[var(--shadow-large)] border-2 border-destructive/30 animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-destructive">Error loading classes</CardTitle>
                  <CardDescription>Try again shortly.</CardDescription>
                </CardHeader>
              </Card>
            )}

            {classes?.map((cls) => (
              <Card key={cls.id} className="shadow-[var(--shadow-large)] border-2 border-primary/20 hover:border-primary/40 hover-scale transition-all overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="truncate">{cls.name}</span>
                  </CardTitle>
                  <CardDescription>Code: {cls.code}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 relative">
                  <Button variant="default" onClick={() => navigate(`/classes/${cls.id}`)} className="flex-1">
                    Open Class
                  </Button>
                </CardContent>
              </Card>
            ))}

            {!isLoading && !error && classes?.length === 0 && (
              <Card className="shadow-[var(--shadow-large)] border-2 border-border animate-fade-in">
                <CardHeader>
                  <CardTitle>No classes yet</CardTitle>
                  <CardDescription>Create a class from Dashboard → Classes tab.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Classes;
