import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  deadline: string | null;
  created_at: string;
  classes: {
    name: string;
    code: string;
  };
  profiles: {
    full_name: string;
    role: string;
  };
}

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        classes (name, code),
        profiles (full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch announcements');
      console.error(error);
    } else {
      // Filter only HOD (admin) announcements
      const hodAnnouncements = (data || []).filter((a: any) => a.profiles?.role === 'admin');
      setAnnouncements(hodAnnouncements);
    }
    setLoading(false);
  };

  const isDeadlineClose = (deadline: string | null) => {
    if (!deadline) return false;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays > 0;
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No announcements yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{announcement.title}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {announcement.classes?.name || 'Unknown Class'} ({announcement.classes?.code || '-'})
                  </span>
                  <span>•</span>
                  <span>By HOD {announcement.profiles?.full_name || 'Unknown'}</span>
                </div>
              </div>
              {announcement.deadline && (
                <Badge 
                  variant={isOverdue(announcement.deadline) ? "destructive" : isDeadlineClose(announcement.deadline) ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {isOverdue(announcement.deadline) ? (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      {format(new Date(announcement.deadline), 'MMM dd, yyyy')}
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
            <p className="text-xs text-muted-foreground mt-3">
              Posted on {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentAnnouncements;
