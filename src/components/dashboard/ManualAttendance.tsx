import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
}

export default function ManualAttendance() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudents(new Set());
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', profile?.id);
    if (data) setClasses(data);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('class_enrollments')
      .select(`
        student_id,
        profiles!inner(id, full_name, student_id, email)
      `)
      .eq('class_id', selectedClass);

    if (data) {
      const studentList = data.map((enrollment: any) => ({
        id: enrollment.profiles.id,
        full_name: enrollment.profiles.full_name,
        student_id: enrollment.profiles.student_id,
        email: enrollment.profiles.email,
      }));
      setStudents(studentList);
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const markAttendance = async () => {
    if (!selectedClass || selectedStudents.size === 0) {
      toast.error('Please select a class and at least one student');
      return;
    }

    setLoading(true);

    // Create an attendance session first
    const { data: sessionData, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert({
        class_id: selectedClass,
        created_by: profile?.id,
        qr_code_data: `manual_${Date.now()}`,
        expires_at: new Date(Date.now() + 60000).toISOString(),
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      toast.error('Failed to create attendance session');
      setLoading(false);
      return;
    }

    // Mark attendance for selected students
    const attendanceRecords = Array.from(selectedStudents).map(studentId => ({
      student_id: studentId,
      session_id: sessionData.id,
      marked_by: profile?.id,
      is_manual: true,
    }));

    const { error } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords);

    if (error) {
      toast.error('Failed to mark attendance');
    } else {
      toast.success(`Marked ${selectedStudents.size} students present`);
      setSelectedStudents(new Set());
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Class</label>
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

        {students.length > 0 && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Students ({students.length})</h3>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.student_id} • {student.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={markAttendance}
              disabled={loading || selectedStudents.size === 0}
              className="w-full"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Mark {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''} Present
            </Button>
          </>
        )}

        {selectedClass && students.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No students enrolled in this class
          </p>
        )}
      </div>
    </div>
  );
}
