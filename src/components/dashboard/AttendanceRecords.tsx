import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CheckCircle2, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceRecordsProps {
  studentId?: string;
}

const AttendanceRecords = ({ studentId }: AttendanceRecordsProps) => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [courses, setCourses] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);

  useEffect(() => {
    if (!studentId && profile?.role === 'teacher') {
      fetchClasses();
      fetchCoursesAndSemesters();
    }
    fetchRecords();
  }, [studentId, selectedClass, selectedCourse, selectedSemester, selectedMonth]);

  const fetchCoursesAndSemesters = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('course, semester')
      .eq('role', 'student');
    
    if (profiles) {
      const uniqueCourses = [...new Set(profiles.map(p => p.course).filter(Boolean))] as string[];
      const uniqueSemesters = [...new Set(profiles.map(p => p.semester).filter(Boolean))] as string[];
      setCourses(uniqueCourses);
      setSemesters(uniqueSemesters);
    }
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', profile?.id)
      .order('name');
    
    if (data) {
      setClasses(data);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        student:profiles!attendance_records_student_id_fkey(full_name, student_id, course, semester),
        session:attendance_sessions(
          *,
          class:classes(name, code)
        )
      `)
      .order('marked_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    } else if (selectedClass !== 'all') {
      query = query.eq('session.class_id', selectedClass);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Filter by class on client side if needed (since we can't filter nested relations directly)
      const filteredData = selectedClass === 'all' || studentId
        ? data
        : data.filter((record: any) => record.session?.class?.id === selectedClass || record.session?.class_id === selectedClass);
      
      setRecords(filteredData);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading records...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No attendance records found.</p>
      </div>
    );
  }

  // Filter records based on search query, course, semester, and month
  const filteredRecords = records.filter((record) => {
    let matches = true;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const studentName = record.student?.full_name?.toLowerCase() || '';
      const studentRoll = record.student?.student_id?.toLowerCase() || '';
      matches = matches && (studentName.includes(query) || studentRoll.includes(query));
    }
    
    // Course filter
    if (selectedCourse !== 'all') {
      matches = matches && record.student?.course === selectedCourse;
    }
    
    // Semester filter
    if (selectedSemester !== 'all') {
      matches = matches && record.student?.semester === selectedSemester;
    }
    
    // Month filter
    if (selectedMonth !== 'all') {
      const recordMonth = format(new Date(record.marked_at), 'yyyy-MM');
      matches = matches && recordMonth === selectedMonth;
    }
    
    return matches;
  });

  const exportToExcel = () => {
    const exportData = filteredRecords.map((record) => ({
      'Student Name': record.student?.full_name || 'Unknown',
      'Roll No': record.student?.student_id || '-',
      'Course': record.student?.course || '-',
      'Semester': record.student?.semester || '-',
      'Class': record.session?.class?.name || 'Unknown',
      'Class Code': record.session?.class?.code || '-',
      'Date': format(new Date(record.marked_at), 'MMM dd, yyyy'),
      'Time': format(new Date(record.marked_at), 'hh:mm a'),
      'Method': record.is_manual ? 'Manual' : 'QR Code',
      'Status': 'Present'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    
    const fileName = `attendance_${selectedCourse !== 'all' ? selectedCourse + '_' : ''}${selectedSemester !== 'all' ? selectedSemester + '_' : ''}${selectedMonth !== 'all' ? selectedMonth + '_' : ''}${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      });
    }
    return months;
  };

  return (
    <div className="space-y-4">
      {!studentId && profile?.role === 'teacher' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            {classes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">Class:</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Course:</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Semester:</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Month:</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {getMonthOptions().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Search:</label>
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Name or Roll No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button onClick={exportToExcel} className="gap-2" disabled={filteredRecords.length === 0}>
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>
      )}
      
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            {!studentId && <TableHead className="min-w-[150px]">Student</TableHead>}
            <TableHead className="min-w-[150px]">Class</TableHead>
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead className="min-w-[100px]">Time</TableHead>
            <TableHead className="min-w-[100px]">Method</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords.map((record) => (
            <TableRow key={record.id} className="hover:bg-muted/50">
              {!studentId && (
                <TableCell className="min-w-[150px]">
                  <div>
                    <p className="font-medium text-sm">{record.student?.full_name || 'Unknown Student'}</p>
                    <p className="text-xs text-muted-foreground">{record.student?.student_id || '-'}</p>
                  </div>
                </TableCell>
              )}
              <TableCell className="min-w-[150px]">
                <div>
                  <p className="font-medium text-sm">{record.session?.class?.name || 'Unknown Class'}</p>
                  <p className="text-xs text-muted-foreground">{record.session?.class?.code || '-'}</p>
                </div>
              </TableCell>
              <TableCell className="min-w-[120px] text-sm">
                {format(new Date(record.marked_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="min-w-[100px] text-sm">
                {format(new Date(record.marked_at), 'hh:mm a')}
              </TableCell>
              <TableCell className="min-w-[100px]">
                <Badge variant={record.is_manual ? 'secondary' : 'default'} className="text-xs">
                  {record.is_manual ? 'Manual' : 'QR Code'}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[100px]">
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium text-sm">Present</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};

export default AttendanceRecords;
