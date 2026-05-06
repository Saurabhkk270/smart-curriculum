import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCheck, Upload, FileText, X } from 'lucide-react';

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
  const [studentStatuses, setStudentStatuses] = useState<Record<string, 'present' | 'leave'>>({});
  const [studentProofs, setStudentProofs] = useState<Record<string, File | null>>({});
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
      // Initialize statuses to present
      const statuses: Record<string, 'present' | 'leave'> = {};
      studentList.forEach(s => statuses[s.id] = 'present');
      setStudentStatuses(statuses);
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

  const handleStatusChange = (studentId: string, status: 'present' | 'leave') => {
    setStudentStatuses(prev => ({ ...prev, [studentId]: status }));
    if (status === 'present') {
      const newProofs = { ...studentProofs };
      delete newProofs[studentId];
      setStudentProofs(newProofs);
    }
  };

  const handleFileChange = (studentId: string, file: File | null) => {
    setStudentProofs(prev => ({ ...prev, [studentId]: file }));
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
    const attendanceRecords = await Promise.all(Array.from(selectedStudents).map(async (studentId) => {
      let proofUrl = null;
      const proofFile = studentProofs[studentId];
      const status = studentStatuses[studentId] || 'present';

      if (status === 'leave' && proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${studentId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('leave-proofs')
          .upload(filePath, proofFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload proof for ${students.find(s => s.id === studentId)?.full_name}`);
        } else {
          const { data: urlData } = supabase.storage
            .from('leave-proofs')
            .getPublicUrl(filePath);
          proofUrl = urlData.publicUrl;
        }
      }

      return {
        student_id: studentId,
        session_id: sessionData.id,
        marked_by: profile?.id,
        is_manual: true,
        status: status,
        leave_proof_url: proofUrl,
      };
    }));

    const { error } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords);

    if (error) {
      toast.error('Failed to mark attendance');
    } else {
      toast.success(`Marked ${selectedStudents.size} students attendance`);
      setSelectedStudents(new Set());
      setStudentProofs({});
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
                      
                      {selectedStudents.has(student.id) && (
                        <div className="mt-3 space-y-3 p-3 bg-muted/50 rounded-md" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-4">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status:</label>
                            <Select 
                              value={studentStatuses[student.id] || 'present'} 
                              onValueChange={(val: 'present' | 'leave') => handleStatusChange(student.id, val)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="leave">Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {studentStatuses[student.id] === 'leave' && (
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Leave Proof:</label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2 text-xs"
                                  asChild
                                >
                                  <label className="cursor-pointer">
                                    <Upload className="w-3 h-3" />
                                    {studentProofs[student.id] ? 'Change Proof' : 'Upload Proof'}
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => handleFileChange(student.id, e.target.files?.[0] || null)}
                                      accept="image/*,.pdf"
                                    />
                                  </label>
                                </Button>
                                {studentProofs[student.id] && (
                                  <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                                    <FileText className="w-3 h-3" />
                                    <span className="max-w-[100px] truncate">{studentProofs[student.id]?.name}</span>
                                    <X 
                                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                                      onClick={() => handleFileChange(student.id, null)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={markAttendance}
              disabled={loading || selectedStudents.size === 0}
              className="w-full shadow-lg hover:shadow-primary/20 transition-all"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Submit Attendance for {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
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
