import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const AttendanceStats = () => {
  const { user } = useAuth();
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttendanceStats();
    }
  }, [user]);

  const fetchAttendanceStats = async () => {
    try {
      // Get all enrolled classes
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', user!.id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = enrollments.map(e => e.class_id);

      // Get total sessions for enrolled classes
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('class_id', classIds);

      if (sessionsError) throw sessionsError;

      // Get attendance records for this student
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('id, session_id')
        .eq('student_id', user!.id);

      if (recordsError) throw recordsError;

      const totalSessions = sessions?.length || 0;
      const attendedSessions = records?.length || 0;

      const percentage = totalSessions > 0 
        ? Math.round((attendedSessions / totalSessions) * 100) 
        : 0;

      setAttendancePercentage(percentage);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLowAttendance = attendancePercentage < 75;

  return (
    <div className="space-y-4">
      <Card className={`border-2 ${isLowAttendance ? 'border-destructive/30' : 'border-primary/30'} shadow-[var(--shadow-large)] transition-all duration-300`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Overall Attendance
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Your total attendance across all classes
              </p>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0">
              <div className={`text-2xl sm:text-3xl font-bold ${isLowAttendance ? 'text-destructive' : 'text-primary'}`}>
                {attendancePercentage}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider ml-2 sm:ml-0">Rate</p>
            </div>
          </div>
          
          <Progress 
            value={attendancePercentage} 
            className={`h-3 ${isLowAttendance ? '[&>div]:bg-destructive' : ''}`}
          />
          
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Required: 75%</span>
            <span className={isLowAttendance ? 'text-destructive font-semibold' : 'text-primary font-semibold'}>
              {attendancePercentage >= 75 ? 'On Track' : `${75 - attendancePercentage}% below target`}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLowAttendance && (
        <Alert variant="destructive" className="border-2 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Low Attendance Warning</AlertTitle>
          <AlertDescription>
            Your attendance is below 75%. This may affect your eligibility for examinations. 
            Please attend your classes regularly to improve your attendance rate.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AttendanceStats;
