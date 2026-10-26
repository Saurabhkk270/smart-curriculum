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

  const isLowAttendance = totalSessionsCount > 0 && attendancePercentage < 75;
  const classesNeeded = isLowAttendance ? Math.ceil((0.75 * totalSessionsCount - attendedSessionsCount) / (1 - 0.75)) : 0;

  return (
    <div className="space-y-4">
      {/* 4 Colorful Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Percentage (Royal Blue / Sapphire) */}
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Attendance Compliance
            </span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLowAttendance ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-black tracking-tight ${isLowAttendance ? 'text-amber-600' : 'text-slate-900'}`}>
                {attendancePercentage}%
              </span>
              <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${isLowAttendance ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                {isLowAttendance ? 'Below 75%' : 'Good Standing'}
              </Badge>
            </div>
            <Progress
              value={attendancePercentage}
              className={`h-2 rounded-full bg-slate-100 ${isLowAttendance ? '[&>div]:bg-amber-500' : '[&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-indigo-600'}`}
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Mandatory: 75%</span>
              <span className={isLowAttendance ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                {isLowAttendance ? `${75 - attendancePercentage}% to target` : 'Compliant ✓'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Attended Lectures (Emerald Green) */}
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Classes Attended
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            <div className="text-3xl font-black text-slate-900">
              {attendedSessionsCount}
              <span className="text-sm font-semibold text-slate-400"> / {totalSessionsCount}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              {totalSessionsCount === 0 ? 'No sessions scheduled yet' : `${attendedSessionsCount} verified lecture hours logged`}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Exam Eligibility Status (Royal Purple / Indigo) */}
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Exam Admit Card
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            <div className="pt-0.5">
              {isLowAttendance ? (
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Advisory Notice</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Clearance Granted</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              {isLowAttendance ? 'Submit condonation letter before finals' : 'Approved for Semester Theory & Labs'}
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Academic Buffer / Standing (Warm Gold / Amber) */}
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Academic Standing
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            <div className="text-base font-bold text-slate-900 pt-0.5">
              {isLowAttendance ? (
                <span className="text-amber-700 font-mono text-sm">Attend next {classesNeeded || 1} lecture(s)</span>
              ) : (
                <span className="text-slate-900">Good Standing</span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              SVSU Academic Ordinance §14(B)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advisory Banner if Low Attendance */}
      {isLowAttendance && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-900 text-xs shadow-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 inline-block mr-1.5">
              Attendance Advisory
            </span>
            <span>
              Your current attendance ({attendancePercentage}%) is below the university threshold (75%). Please ensure attendance in upcoming lectures to avoid hall ticket debarment.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStats;
