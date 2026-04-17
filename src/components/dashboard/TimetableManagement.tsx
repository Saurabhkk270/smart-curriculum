import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Trash2, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Timetable {
  id: string;
  course: string;
  semester: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export default function TimetableManagement() {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const [course, setCourse] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    const { data } = await supabase
      .from('timetables')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (data) setTimetables(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadTimetable = async () => {
    if (!file || !course || !semester) {
      toast.error('Please enter course, semester and select a file');
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('timetables')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      setUploading(false);
      return;
    }

    // Create timetable record
    const { error: dbError } = await supabase
      .from('timetables')
      .insert({
        course: course,
        semester: semester,
        file_name: file.name,
        file_path: fileName,
        uploaded_by: profile?.id,
      });

    if (dbError) {
      toast.error('Failed to save timetable record');
    } else {
      toast.success('Timetable uploaded successfully');
      setFile(null);
      setCourse('');
      setSemester('');
      fetchTimetables();
    }

    setUploading(false);
  };

  const deleteTimetable = async (timetable: Timetable) => {
    const { error: storageError } = await supabase.storage
      .from('timetables')
      .remove([timetable.file_path]);

    const { error: dbError } = await supabase
      .from('timetables')
      .delete()
      .eq('id', timetable.id);

    if (storageError || dbError) {
      toast.error('Failed to delete timetable');
    } else {
      toast.success('Timetable deleted');
      fetchTimetables();
    }
  };

  const downloadTimetable = async (timetable: Timetable) => {
    const { data } = await supabase.storage
      .from('timetables')
      .download(timetable.file_path);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = timetable.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {isTeacher && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Timetable
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Course Name</label>
              <Input
                type="text"
                placeholder="e.g., Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Input
                type="text"
                placeholder="e.g., 1st Semester, Spring 2024"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Choose File</label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            <Button
              onClick={uploadTimetable}
              disabled={uploading || !file || !course || !semester}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Timetable'}
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          All Timetables
        </h3>

        {timetables.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No timetables uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {timetables.map((timetable) => (
              <Card key={timetable.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{timetable.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {timetable.course} - {timetable.semester} •{' '}
                      {format(new Date(timetable.uploaded_at), 'PPp')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTimetable(timetable)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isTeacher && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTimetable(timetable)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
