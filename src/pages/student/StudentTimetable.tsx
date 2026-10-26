import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, Clock, MapPin } from 'lucide-react';
import StudentTimetableComponent from '@/components/dashboard/StudentTimetable';
import { useAuth } from '@/components/AuthProvider';

const StudentTimetable = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Official SVSU Timetable Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Academic Curriculum
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-700" />
              Weekly Lecture Timetable & Room Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Official Schedule for {profile?.course || 'Enrolled Program'} ({profile?.semester || 'Semester Regular'})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Campus Blocks</span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 justify-end">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Academic Block A & B
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Weekly Lecture Schedule</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Approved curriculum timetable scheduled by the Academic Planning & Allocation Committee.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentTimetableComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;
