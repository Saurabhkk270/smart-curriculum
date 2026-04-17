import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Timetable {
  id: string;
  course: string;
  semester: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

const StudentTimetable = () => {
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimetables = async () => {
    if (!course.trim() || !semester.trim()) {
      toast.error('Please enter both course and semester');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('course', course.trim())
      .eq('semester', semester.trim())
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch timetables');
      console.error(error);
    } else {
      setTimetables(data || []);
      if (!data || data.length === 0) {
        toast.info('No timetables found for this course and semester');
      }
    }
    setLoading(false);
  };

  const downloadTimetable = async (timetable: Timetable) => {
    const { data, error } = await supabase.storage
      .from('timetables')
      .download(timetable.file_path);

    if (error) {
      toast.error('Failed to download timetable');
      console.error(error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = timetable.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Timetable downloaded');
  };

  const viewTimetable = (timetable: Timetable) => {
    const { data } = supabase.storage
      .from('timetables')
      .getPublicUrl(timetable.file_path);
    
    window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course">Course Name</Label>
          <Input
            id="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Input
            id="semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="e.g., Fall 2024"
          />
        </div>
      </div>

      <Button onClick={fetchTimetables} disabled={loading} className="w-full md:w-auto">
        {loading ? 'Searching...' : 'View Timetable'}
      </Button>

      {timetables.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Available Timetables</h3>
          <div className="grid gap-3">
            {timetables.map((timetable) => (
              <Card key={timetable.id} className="shadow-[var(--shadow-soft)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{timetable.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {timetable.course} - {timetable.semester}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewTimetable(timetable)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadTimetable(timetable)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
