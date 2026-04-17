import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle2, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayContentProps } from 'react-day-picker';

interface AttendanceDay {
  date: Date;
  classId: string;
  className: string;
}

interface Holiday {
  date: Date;
  name: string;
}

const AttendanceCalendar = () => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledClasses();
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchAttendanceDays();
    }
  }, [selectedClass, profile?.id]);

  const fetchEnrolledClasses = async () => {
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id, classes(id, name, code)')
      .eq('student_id', profile?.id);

    if (enrollments) {
      const classData = enrollments.map((e: any) => e.classes).filter(Boolean);
      setClasses(classData);
    }
  };

  const fetchHolidays = async () => {
    const { data } = await supabase
      .from('holidays')
      .select('date, name')
      .eq('country', 'IN')
      .order('date');

    if (data) {
      setHolidays(data.map((h: any) => ({
        date: parseISO(h.date),
        name: h.name
      })));
    }
  };

  const fetchAttendanceDays = async () => {
    setLoading(true);
    
    let query = supabase
      .from('attendance_records')
      .select(`
        marked_at,
        session:attendance_sessions(
          class_id,
          class:classes(id, name)
        )
      `)
      .eq('student_id', profile?.id);

    const { data } = await query;

    if (data) {
      const days: AttendanceDay[] = data
        .filter((record: any) => {
          if (selectedClass === 'all') return true;
          return record.session?.class_id === selectedClass;
        })
        .map((record: any) => ({
          date: parseISO(record.marked_at),
          classId: record.session?.class_id || '',
          className: record.session?.class?.name || 'Unknown'
        }));
      
      setAttendanceDays(days);
    }
    setLoading(false);
  };

  const isAttendanceDay = (date: Date) => {
    return attendanceDays.some(ad => isSameDay(ad.date, date));
  };

  const isHoliday = (date: Date) => {
    return holidays.find(h => isSameDay(h.date, date));
  };

  const getAttendanceForDate = (date: Date) => {
    return attendanceDays.filter(ad => isSameDay(ad.date, date));
  };

  const DayContent = (props: DayContentProps) => {
    const { date } = props;
    const hasAttendance = isAttendanceDay(date);
    const holiday = isHoliday(date);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={cn(
          "relative z-10",
          hasAttendance && "font-bold text-white",
          holiday && !hasAttendance && "font-semibold"
        )}>
          {format(date, 'd')}
        </span>
        {hasAttendance && (
          <div className="absolute inset-0 bg-green-500 rounded-md flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white absolute top-0.5 right-0.5" />
          </div>
        )}
        {holiday && !hasAttendance && (
          <div className="absolute inset-0 bg-orange-400/30 rounded-md flex items-center justify-center">
            <PartyPopper className="w-3 h-3 text-orange-600 absolute top-0.5 right-0.5" />
          </div>
        )}
      </div>
    );
  };

  const selectedDateInfo = selectedDate ? {
    attendance: getAttendanceForDate(selectedDate),
    holiday: isHoliday(selectedDate)
  } : null;

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-large)] border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            Attendance Calendar
          </CardTitle>
          <CardDescription>
            Green days show when you attended class. Orange days are national holidays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {classes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Filter by Subject:</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto"
              components={{
                DayContent
              }}
            />
          </div>

          {selectedDateInfo && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2">
                {format(selectedDate!, 'MMMM dd, yyyy')}
              </h4>
              
              {selectedDateInfo.holiday && (
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <PartyPopper className="w-4 h-4" />
                  <span className="font-medium">{selectedDateInfo.holiday.name}</span>
                </div>
              )}

              {selectedDateInfo.attendance.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Attendance Marked</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedDateInfo.attendance.map((att, idx) => (
                      <div key={idx}>• {att.className}</div>
                    ))}
                  </div>
                </div>
              ) : !selectedDateInfo.holiday && (
                <p className="text-sm text-muted-foreground">No attendance marked on this day</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">Attended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-400/30 rounded flex items-center justify-center">
                <PartyPopper className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm">Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendar;
