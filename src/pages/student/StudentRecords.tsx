import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import AttendanceRecords from '@/components/dashboard/AttendanceRecords';
import { useAuth } from '@/components/AuthProvider';

const StudentRecords = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Official SVSU Academic Ledger Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Academic Transcript
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Office of the Controller of Examinations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-700" />
              Official Student Attendance Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Verified Class Participation Audit Record
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Candidate</span>
              <span className="text-xs font-bold text-slate-800">{profile?.full_name || 'Enrolled Student'}</span>
              <span className="text-[10px] font-mono text-slate-500 block">{profile?.student_id || 'ID Pending'}</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Course-wise Lecture Attendance Log
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Detailed ledger of all verified QR check-ins, manual teacher entries, and excused duty leaves.
              </CardDescription>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Tamper-Proof Audit Active
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceRecords />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRecords;
