import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  GraduationCap, 
  IdCard, 
  CheckCircle2, 
  X,
  Camera
} from 'lucide-react';
import QRScanner from '@/components/dashboard/QRScanner';
import { useAuth } from '@/components/AuthProvider';
import AttendanceStats from '@/components/dashboard/AttendanceStats';

const StudentScanner = () => {
  const { profile } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Institutional Breadcrumb & Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Academic Terminal
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <IdCard className="w-6 h-6 text-blue-700" />
              Digital Attendance Verification Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Official Biometric & Smart QR Lecture Check-in
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Campus Clock</span>
              <span className="font-mono text-xs font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {currentTime || '09:00:00 AM IST'}
              </span>
            </div>
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Network Geo-Check</span>
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 justify-end">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Palwal Campus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Student Digital Credential Pass Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Enrolled Student Digital Credential
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-[10px] font-mono">
              <ShieldCheck className="w-3 h-3 mr-1 inline" /> SECURE TOKEN ACTIVE
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Candidate Name</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5 truncate">
                {profile?.full_name || 'Enrolled Student'}
              </span>
              <span className="text-[11px] text-slate-500 truncate block">{profile?.email || 'student@svsu.ac.in'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Registration / Roll No.</span>
              <span className="text-sm font-mono font-bold text-blue-700 block mt-0.5">
                {profile?.student_id || 'NOT_REGISTERED'}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 inline" /> Matriculated & Verified
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Academic Program</span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5 truncate">
                {profile?.course || 'Skill Degree / Diploma'}
              </span>
              <span className="text-[11px] text-slate-500">School of Engineering & Skill</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Term</span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {profile?.semester || 'Term Active'}
              </span>
              <span className="text-[11px] text-slate-500">Regular Academic Session</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Academic Compliance & Exam Clearance Metric Grid */}
      <div>
        <div className="mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attendance Regulatory Compliance (Ordinance §14)
          </h2>
        </div>
        <AttendanceStats />
      </div>

      {/* Secure Lecture QR Verification Console */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-700" />
                Lecture Attendance Check-In Console
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Scan dynamic, cryptographic QR codes projected by faculty during active lecture hours.
              </CardDescription>
            </div>
            {!showScanner ? (
              <Button 
                onClick={() => setShowScanner(true)} 
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs h-9 px-4 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Initialize Scanner Camera
              </Button>
            ) : (
              <Button 
                onClick={() => setShowScanner(false)} 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-9 px-4"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Dismiss Scanner
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!showScanner ? (
            <div className="max-w-xl mx-auto py-8 px-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 shadow-sm">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Camera Scanner Ready for Verification
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
                When your instructor displays the dynamic QR code on the lecture screen, click the button below to authorize camera access and scan your attendance.
              </p>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowScanner(true)} 
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm h-11 px-6 shadow rounded-md"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Open Verified QR Scanner
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">1. Time Limited</span>
                  <p className="text-[11px] text-slate-600 mt-1">Codes expire every 15 seconds to prevent screenshot sharing.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">2. Single Scan</span>
                  <p className="text-[11px] text-slate-600 mt-1">Duplicate check-ins within the same session are rejected automatically.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">3. Audit Log</span>
                  <p className="text-[11px] text-slate-600 mt-1">Marked attendance is timestamped and recorded in the University Central Ledger.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto py-4">
              <div className="mb-4 text-center">
                <span className="text-xs font-semibold text-slate-700">
                  Align the QR code within the target reticle below
                </span>
              </div>
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 shadow-inner">
                <QRScanner onClose={() => setShowScanner(false)} />
              </div>
              <div className="text-center mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowScanner(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel / Return to Terminal Overview
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* University Statute Notice & Anti-Proxy Advisory */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 text-xs">
            University Ordinance §18(C) - Academic Integrity Notice:
          </span>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Proxy attendance, falsification of digital identity, or unauthorized code distribution constitutes an academic violation. All check-ins are logged with device fingerprint and timestamp. Violations will be referred to the Proctorial Board for disciplinary debarment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentScanner;
