import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, ArrowLeft, Users, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface ClassInfo { id: string; name: string; code: string; }
interface Profile { id: string; full_name: string; email: string; student_id: string | null; course: string | null; semester: string | null; }
interface Announcement { id: string; title: string; content: string; created_at: string; deadline: string | null; teacher_id: string; class_id: string; }
interface StudentWithAttendance extends Profile { attendancePercentage: number; }

const fetchClass = async (id: string) => {
  const { data, error } = await supabase.from('classes').select('id, name, code').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as ClassInfo | null;
};

const fetchEnrollments = async (classId: string) => {
  const { data, error } = await supabase.from('class_enrollments').select('student_id').eq('class_id', classId);
  if (error) throw error;
  const ids = (data || []).map((r) => r.student_id);
  if (ids.length === 0) return [] as Profile[];
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email, student_id, course, semester').in('id', ids);
  if (pErr) throw pErr;
  return (profiles || []) as Profile[];
};

const fetchAnnouncements = async (classId: string) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, content, created_at, deadline, teacher_id, class_id')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
};

const fetchStudentsWithAttendance = async (classId: string): Promise<StudentWithAttendance[]> => {
  // Fetch enrolled students
  const students = await fetchEnrollments(classId);
  
  // Fetch all attendance sessions for this class
  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('id')
    .eq('class_id', classId);
  
  if (sessionsError) throw sessionsError;
  const totalSessions = sessions?.length || 0;
  
  if (totalSessions === 0 || students.length === 0) {
    return students.map(s => ({ ...s, attendancePercentage: 0 }));
  }
  
  // Fetch attendance records for all students in this class
  const studentIds = students.map(s => s.id);
  const sessionIds = sessions.map(s => s.id);
  
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('student_id, session_id')
    .in('student_id', studentIds)
    .in('session_id', sessionIds);
  
  if (recordsError) throw recordsError;
  
  // Calculate attendance percentage for each student
  const studentsWithAttendance: StudentWithAttendance[] = students.map(student => {
    const studentRecords = records?.filter(r => r.student_id === student.id) || [];
    const attendancePercentage = totalSessions > 0 ? (studentRecords.length / totalSessions) * 100 : 0;
    return { ...student, attendancePercentage: Math.round(attendancePercentage) };
  });
  
  return studentsWithAttendance;
};

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qc = useQueryClient();

  useEffect(() => { document.title = 'Class Details | Smart Curriculum'; }, []);

  const { data: classInfo, isLoading: classLoading, error: classError } = useQuery({
    queryKey: ['class', id],
    queryFn: () => fetchClass(id!),
    enabled: !!id,
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['class-students', id],
    queryFn: () => fetchStudentsWithAttendance(id!),
    enabled: !!id,
  });

  const { data: announcements, isLoading: annLoading, error: annError } = useQuery({
    queryKey: ['class-announcements', id],
    queryFn: () => fetchAnnouncements(id!),
    enabled: !!id,
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');

  const canPost = useMemo(() => profile && (profile.role === 'teacher' || profile.role === 'admin'), [profile]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!id || !profile) throw new Error('Missing parameters');
      const payload: any = {
        title,
        content,
        class_id: id,
        teacher_id: profile.id,
      };
      if (deadline) payload.deadline = new Date(deadline).toISOString();
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Announcement posted');
      setOpen(false);
      setTitle('');
      setContent('');
      setDeadline('');
      qc.invalidateQueries({ queryKey: ['class-announcements', id] });
    },
    onError: (e: any) => {
      toast.error(e.message || 'Failed to post announcement');
    },
  });

  const loading = classLoading || studentsLoading || annLoading;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">Sign in to view class.</div>
    );
  }

  if (classError || studentsError || annError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">Failed to load class data.</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent truncate">{classInfo?.name || 'Class'}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Code: {classInfo?.code}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/classes')} className="flex-shrink-0 pointer-events-auto hover:bg-primary hover:text-primary-foreground transition-all">
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))] p-8 text-white shadow-2xl animate-fade-in">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{classInfo?.name}</h2>
            <p className="text-white/95 drop-shadow">View enrolled students, post announcements, and manage assignments</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>
        </div>

        {/* Students */}
        <Card className="shadow-[var(--shadow-large)] border-2 border-primary/20 overflow-hidden animate-fade-in-up">
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
              Students
            </CardTitle>
            <CardDescription>Enrolled students in this class</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students && students.length > 0 ? (
                      students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.email}</TableCell>
                          <TableCell>{s.student_id || '-'}</TableCell>
                          <TableCell>{s.course || '-'}</TableCell>
                          <TableCell>{s.semester || '-'}</TableCell>
                          <TableCell>
                            <span className={`font-semibold ${s.attendancePercentage < 75 ? 'text-destructive' : 'text-primary'}`}>
                              {s.attendancePercentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No students enrolled.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="shadow-[var(--shadow-large)] border-2 border-accent/20 overflow-hidden animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10"><Bell className="w-5 h-5 text-accent" /></div>
                <div>
                  <CardTitle>Announcements & Assignments</CardTitle>
                  <CardDescription>Share assignments, deadlines, and updates</CardDescription>
                </div>
              </div>
              {canPost && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">New Announcement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post Announcement</DialogTitle>
                      <DialogDescription>Visible to all students enrolled in this class.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment 1: Research" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Details</label>
                        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write details and requirements..." rows={5} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Deadline (optional)</label>
                        <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button onClick={() => createMutation.mutate()} disabled={!title || !content || createMutation.isPending}>
                        {createMutation.isPending ? 'Posting...' : 'Post'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {annLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-lg border bg-card hover-scale">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{a.title}</h3>
                      {a.deadline && (
                        <span className="text-sm text-muted-foreground">Due: {new Date(a.deadline).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">Posted {new Date(a.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No announcements yet.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClassDetails;
