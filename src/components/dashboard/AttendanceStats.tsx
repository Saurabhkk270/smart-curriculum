import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  CalendarCheck,
  ShieldCheck,
  Clock,
  BookOpen,
} from 'lucide-react';

const AttendanceStats = () => {
  const { user, profile } = useAuth();
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);
  const [attendedSessionsCount, setAttendedSessionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttendanceStats();
    }
  }, [user]);

  const fetchAttendanceStats = async () => {
    try {
      // 1. Get enrolled classes
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', user!.id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = enrollments.map((e) => e.class_id);

      // 2. Get total attendance sessions for enrolled classes
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('class_id', classIds);

      if (sessionsError) throw sessionsError;

      // 3. Get student attendance records
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('id, session_id')
        .eq('student_id', user!.id);

      if (recordsError) throw recordsError;

      const total = sessions?.length || 0;
      const attended = records?.length || 0;

      setTotalSessionsCount(total);
      setAttendedSessionsCount(attended);

      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
      setAttendancePercentage(percentage);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLowAttendance = attendancePercentage < 75;

  return (
    <div className="space-y-4">
      {/* Executive Academic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Overall Percentage */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance Compliance
            </span>
            <div className={`h-7 w-7 rounded-md flex items-center justify-center ${isLowAttendance ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold tracking-tight ${isLowAttendance ? 'text-red-600' : 'text-slate-900'}`}>
                {attendancePercentage}%
              </span>
              <Badge variant="outline" className={`text-xs ${isLowAttendance ? 'border-red-200 text-red-700 bg-red-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
                {isLowAttendance ? 'Shortfall' : 'Good Standing'}
              </Badge>
            </div>
            <Progress
              value={attendancePercentage}
              className={`h-2 bg-slate-100 ${isLowAttendance ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-600'}`}
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Mandatory: 75%</span>
              <span className="font-semibold text-slate-700">
                {isLowAttendance ? `${75 - attendancePercentage}% needed` : 'Threshold Satisfied'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Lectures Attended */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attended Lectures
            </span>
            <div className="h-7 w-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900">
              {attendedSessionsCount}
              <span className="text-base font-normal text-slate-400"> / {totalSessionsCount}</span>
            </div>
            <p className="text-xs text-slate-500">
              Verified sessions logged this term
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Exam Eligibility Status */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Examination Clearance
            </span>
            <div className={`h-7 w-7 rounded-md flex items-center justify-center ${isLowAttendance ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-700'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 pt-1">
              {isLowAttendance ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-700 text-sm">Under Review</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">Eligible for Hall Ticket</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isLowAttendance ? 'Requires medical proof or dean waiver' : 'Regular academic standing verified'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Defaulter Alert if < 75% */}
      {isLowAttendance && (
        <Alert variant="destructive" className="border border-red-200 bg-red-50 text-red-900 py-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-semibold text-xs tracking-wide uppercase">
            Attendance Advisory Notice
          </AlertTitle>
          <AlertDescription className="text-xs text-red-700 mt-0.5">
            Your lecture attendance is currently below the university regulatory threshold (75%). Please ensure regular class attendance. Submit valid physician medical certificates under Attendance Records if condonation is required.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AttendanceStats;
