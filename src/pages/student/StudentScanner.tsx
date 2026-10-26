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
  Camera,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Wifi
} from 'lucide-react';
import QRScanner from '@/components/dashboard/QRScanner';
import { useAuth } from '@/components/AuthProvider';
import AttendanceStats from '@/components/dashboard/AttendanceStats';
import { Link } from 'react-router-dom';

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

  const studentName = profile?.full_name || 'Saurabh Kakkar';
  const studentRoll = profile?.student_id || '25UGCSE151';
  const studentCourse = profile?.course || 'B.Tech - Computer Science & Engineering';
  const studentSem = profile?.semester || 'Semester IV (Even Term 2026-27)';
  const studentInitials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SK';

  return (
    <div className="space-y-6">
      {/* 1. HERO OFFICIAL SVSU STUDENT SMART DIGITAL ID CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-7 shadow-xl border border-blue-900/40">
        {/* Subtle Background Glow Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Card Top Branding Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img src="/logo.png" alt="University Seal" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block leading-none">
                  Shri Vishwakarma Skill University
                </span>
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white block mt-0.5">
                  Official Student Digital Academic Identity
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono px-2.5 py-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> VERIFIED CREDENTIAL
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-mono px-2.5 py-1">
                SESSION 2026-27
              </Badge>
            </div>
          </div>

          {/* Student Identity Core Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Student Avatar & Basic Info */}
            <div className="md:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg">
                  <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                    {studentInitials}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {studentName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                    ROLL: {studentRoll}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-200 font-semibold">{studentCourse}</span>
                </div>
                <p className="text-xs text-slate-400 pt-0.5">
                  {studentSem} • School of Engineering & Skill Development
                </p>
              </div>
            </div>

            {/* Live Campus Telemetry Box */}
            <div className="md:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Campus Clock:</span>
                <span className="font-mono font-bold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {currentTime || '09:00:00 AM IST'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Campus Subnet:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  SVSU_SECURE (Verified)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Academic Standing:</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Good Standing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTENDANCE REGULATORY COMPLIANCE HUD */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Academic Attendance Compliance Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Real-time audit compliance under SVSU Academic Ordinance §14 (Mandatory 75% for Examination Clearance)
            </p>
          </div>
          <Link to="/dashboard/records" className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
            Detailed Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <AttendanceStats />
      </div>

      {/* 3. ACTIVE LECTURE CHECK-IN TERMINAL */}
      <Card className="border border-slate-200/90 shadow-md bg-white overflow-hidden rounded-xl">
        <div className="bg-slate-900 px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Classroom Attendance QR Verification Terminal
              </h3>
              <p className="text-xs text-slate-300">
                Point your device camera at the cryptographic QR code projected by faculty during active lecture hours.
              </p>
            </div>
          </div>

          {!showScanner ? (
            <Button 
              onClick={() => setShowScanner(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 shadow-md rounded-lg shrink-0"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Open Camera Scanner
            </Button>
          ) : (
            <Button 
              onClick={() => setShowScanner(false)} 
              variant="outline"
              className="border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700 text-xs h-10 px-4 shrink-0"
            >
              <X className="w-4 h-4 mr-1.5" />
              Close Scanner
            </Button>
          )}
        </div>

        <CardContent className="p-6">
          {!showScanner ? (
            <div className="max-w-xl mx-auto py-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200/80 flex items-center justify-center text-blue-700 mb-4 shadow-sm group">
                <QrCode className="w-10 h-10 transition-transform group-hover:scale-110" />
              </div>
              
              <h4 className="text-lg font-black text-slate-900 mb-1">
                Ready for Lecture Attendance Verification
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
                When your instructor activates the lecture session on the classroom smart screen, tap below to authorize your camera and log your attendance token.
              </p>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowScanner(true)} 
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm h-12 px-8 shadow-lg shadow-blue-700/20 rounded-xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Launch Secure QR Scanner
                </Button>
              </div>

              {/* Security Features */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">15-Sec Dynamic Code</span>
                  <p className="text-[11px] text-slate-600 mt-1">Codes expire every 15 seconds to prevent proxy attendance.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Geofence Verified</span>
                  <p className="text-[11px] text-slate-600 mt-1">Only scans within official campus network range are accepted.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Tamper-Proof Audit</span>
                  <p className="text-[11px] text-slate-600 mt-1">Attendance is instantly credited to your examination hall ticket record.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto py-2">
              <div className="mb-3 text-center">
                <span className="text-xs font-semibold text-slate-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                  ● Camera Active: Align the classroom QR code inside the box
                </span>
              </div>
              <div className="border-2 border-blue-500 rounded-xl p-3 bg-slate-900 shadow-xl">
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

      {/* 4. TODAY'S LECTURE TIMETABLE PREVIEW */}
      <Card className="border border-slate-200/90 shadow-sm bg-white overflow-hidden rounded-xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200/90 py-3.5 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm font-bold text-slate-900">Today's Lecture Schedule & Room Allocations</CardTitle>
          </div>
          <Link to="/dashboard/timetable" className="text-xs font-semibold text-blue-700 hover:underline">
            Full Weekly Timetable →
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                  09:30 AM - 10:30 AM
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Logged
                </span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">Operating Systems (CS-401)</h5>
              <p className="text-xs text-slate-500 mt-1">Dr. Meenakshi • Academic Block A, Room 204</p>
            </div>

            <div className="p-3.5 rounded-lg border-2 border-blue-500/50 bg-blue-50/40 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-white uppercase bg-blue-600 px-2 py-0.5 rounded">
                  11:30 AM - 12:30 PM (Active)
                </span>
                <span className="text-[11px] text-blue-700 font-bold animate-pulse">
                  ● Scan Now
                </span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">Design & Analysis of Algorithms</h5>
              <p className="text-xs text-slate-600 mt-1">Prof. Sharma • Computer Lab 3</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-200 px-2 py-0.5 rounded">
                  02:00 PM - 03:00 PM
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Upcoming</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">Database Management Systems</h5>
              <p className="text-xs text-slate-500 mt-1">Dr. Verma • Lecture Hall 102</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. UNIVERSITY STATUTORY ADVISORY */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 text-xs">
            University Ordinance §18(C) - Academic Integrity & Anti-Proxy Notice:
          </span>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Proxy attendance, sharing dynamic QR images, or falsifying device tokens constitutes an academic violation. All check-ins are logged with device fingerprint, timestamp, and institutional ID. Violations are referred to the Proctorial Board for examination debarment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentScanner;
