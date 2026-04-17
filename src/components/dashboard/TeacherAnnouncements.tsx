import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

interface Class {
  id: string;
  name: string;
  code: string;
}

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
}

const TeacherAnnouncements = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchAnnouncements();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, code')
      .eq('teacher_id', profile?.id)
      .order('name');

    if (error) {
      toast.error('Failed to fetch classes');
      console.error(error);
    } else {
      setClasses(data || []);
    }
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        classes (name, code)
      `)
      .eq('teacher_id', profile?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch announcements');
      console.error(error);
    } else {
      setAnnouncements(data || []);
    }
  };

  const createAnnouncement = async () => {
    if (!selectedClass || !title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('announcements').insert({
      class_id: selectedClass,
      teacher_id: profile?.id,
      title: title.trim(),
      content: content.trim(),
      deadline: deadline || null,
    });

    if (error) {
      toast.error('Failed to create announcement');
      console.error(error);
    } else {
      toast.success('Announcement posted successfully');
      setTitle('');
      setContent('');
      setDeadline('');
      setSelectedClass('');
      fetchAnnouncements();
    }
    setLoading(false);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete announcement');
      console.error(error);
    } else {
      toast.success('Announcement deleted');
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class">Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title or announcement"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the assignment, deadline details, or announcement..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Button onClick={createAnnouncement} disabled={loading} className="w-full">
            {loading ? 'Posting...' : 'Post Announcement'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">My Announcements</h3>
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No announcements yet
          </div>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{announcement.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.classes.name} ({announcement.classes.code})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.deadline && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(announcement.deadline), 'MMM dd, yyyy')}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAnnouncement(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Posted on {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherAnnouncements;
