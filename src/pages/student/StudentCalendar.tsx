import { CalendarDays, Landmark, CheckCircle2 } from 'lucide-react';
import AttendanceCalendar from '@/components/dashboard/AttendanceCalendar';
import { useAuth } from '@/components/AuthProvider';

const StudentCalendar = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Official SVSU Calendar Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm">
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
              Academic Attendance Register & National Holiday Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Verified Class Presence, Gazetted National Holidays & Recess Days
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <span className="font-semibold text-slate-900">{profile?.full_name || 'Student'}</span> • {profile?.student_id || 'ID Active'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Calendar with National & State Holidays Directory */}
      <AttendanceCalendar />
    </div>
  );
};

export default StudentCalendar;
