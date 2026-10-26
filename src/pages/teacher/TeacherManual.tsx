import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, ClipboardCheck } from 'lucide-react';
import ManualAttendance from '@/components/dashboard/ManualAttendance';

const TeacherManual = () => {
  return (
    <div className="space-y-6">
      {/* Official SVSU Manual Register Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Attendance Register
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Faculty Roll Call</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-blue-700" />
              Manual Roll Call & Exemption Override Register
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Official Instructor Override & Excused Duty Entry
            </p>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Manual Roll-Call Sheet</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            For laboratory sessions, field work, or approved institutional duty leaves where QR scanning is impractical.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ManualAttendance />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManual;
