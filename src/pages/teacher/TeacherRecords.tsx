import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, ShieldCheck, Download } from 'lucide-react';
import AttendanceRecords from '@/components/dashboard/AttendanceRecords';

const TeacherRecords = () => {
  return (
    <div className="space-y-6">
      {/* Official SVSU Faculty Records Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Departmental Audit
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-700" />
              Faculty Attendance Ledger & Excel Export
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Verified Class Records, Percentages & Statutory Compliance
            </p>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Attendance Log & Audit Register</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Filter by class, course, semester, or month, and export official reports formatted for examination board submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceRecords />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherRecords;
