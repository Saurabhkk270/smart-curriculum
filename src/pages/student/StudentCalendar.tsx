import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import AttendanceCalendar from '@/components/dashboard/AttendanceCalendar';
import { useAuth } from '@/components/AuthProvider';

const StudentCalendar = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Official SVSU Calendar Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Academic Register
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-700" />
              Monthly Attendance Register & Working Days Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Daily Class Presence & Instructional Day Tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <span className="font-semibold text-slate-900">{profile?.full_name || 'Student'}</span> • {profile?.student_id || 'ID Active'}
            </div>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Attendance Calendar View</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Interactive day-wise attendance status: Green indicates verified attendance, Amber indicates leave/duty, Red indicates absent.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceCalendar />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentCalendar;
