import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { QrCode, TrendingUp, BookOpen, Bell, CalendarDays } from 'lucide-react';
import QRScanner from './QRScanner';
import AttendanceRecords from './AttendanceRecords';
import StudentTimetable from './StudentTimetable';
import StudentAnnouncements from './StudentAnnouncements';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceStats from './AttendanceStats';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))] p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Welcome Back, Student!</h1>
          <p className="text-white/95 drop-shadow">Track your attendance and stay updated with your courses</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>
      </div>

      <AttendanceStats />

      {/* Scanner Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">QR Scanner</CardTitle>
              <CardDescription>Scan QR codes to mark your attendance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="p-6 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Student ID: {profile?.student_id || 'N/A'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Click the button below to scan attendance QR codes</p>
                  <Button onClick={() => setShowScanner(true)} className="shadow-md hover:shadow-lg transition-all">
                    Open QR Scanner
                  </Button>
                </div>
              </div>
            </div>
            {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Attendance Calendar</CardTitle>
              <CardDescription>View your attendance history by date</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceCalendar />
        </CardContent>
      </Card>

      {/* Timetable Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Timetable</CardTitle>
              <CardDescription>View your class schedule</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentTimetable />
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Announcements</CardTitle>
              <CardDescription>Stay updated with class announcements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentAnnouncements />
        </CardContent>
      </Card>

      {/* Records Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Attendance Records</CardTitle>
              <CardDescription>View your complete attendance history</CardDescription>
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

export default StudentDashboard;
