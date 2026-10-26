import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Cast, Clock, ShieldCheck } from 'lucide-react';
import QRGenerator from '@/components/dashboard/QRGenerator';

const TeacherQRCode = () => {
  return (
    <div className="space-y-6">
      {/* Official SVSU Faculty QR Terminal Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Classroom Broadcast
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-700" />
              Dynamic Lecture Attendance Broadcast Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Time-Expiring Smart QR Projection Terminal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Dynamic Anti-Proxy Active
            </span>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Attendance QR Broadcast Terminal</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Select an active class session and project the cryptographic QR code onto the classroom smart board or projector screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <QRGenerator />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherQRCode;
