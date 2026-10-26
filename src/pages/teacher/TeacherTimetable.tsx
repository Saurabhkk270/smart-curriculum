import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import TimetableManagement from '@/components/dashboard/TimetableManagement';

const TeacherTimetable = () => {
  return (
    <div className="space-y-6">
      {/* Official SVSU Faculty Timetable Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Instructional Timetable
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-700" />
              Faculty Instructional Schedule & Room Allocation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Weekly Lecture Schedule, Practical Labs & Student Rotations
            </p>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Weekly Schedule Configuration</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Define recurring lecture slots, room allocations, and publish updates to students.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TimetableManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherTimetable;
