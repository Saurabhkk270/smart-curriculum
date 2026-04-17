import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';

const StudentEnrollment = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchEnrolledStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', profile?.id);
    
    if (data) setClasses(data);
  };

  const fetchEnrolledStudents = async () => {
    const { data } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        student_id,
        enrolled_at,
        profiles!class_enrollments_student_id_fkey(full_name, email, student_id)
      `)
      .eq('class_id', selectedClass);
    
    if (data) setEnrolledStudents(data);
  };

  const enrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Find student by email
    const { data: studentData, error: studentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', studentEmail.trim())
      .eq('role', 'student')
      .maybeSingle();

    if (studentError || !studentData) {
      toast.error('Student not found with this email');
      setLoading(false);
      return;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', selectedClass)
      .eq('student_id', studentData.id)
      .single();

    if (existing) {
      toast.error('Student already enrolled in this class');
      setLoading(false);
      return;
    }

    // Enroll student
    const { error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: selectedClass,
        student_id: studentData.id
      });

    if (error) {
      toast.error('Failed to enroll student');
    } else {
      toast.success('Student enrolled successfully!');
      setStudentEmail('');
      fetchEnrolledStudents();
    }
    setLoading(false);
  };

  const removeStudent = async (enrollmentId: string) => {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) {
      toast.error('Failed to remove student');
    } else {
      toast.success('Student removed from class');
      fetchEnrolledStudents();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enroll Students</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={enrollStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
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

            {selectedClass && (
              <div className="space-y-2">
                <Label htmlFor="student-id">Student Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="student-id"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="Enter student email"
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {selectedClass && enrolledStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students ({enrolledStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrolledStudents.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{enrollment.profiles?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.profiles?.email || 'No email'}
                      {enrollment.profiles?.student_id && ` • ID: ${enrollment.profiles.student_id}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStudent(enrollment.id)}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && enrolledStudents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No students enrolled in this class yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentEnrollment;
