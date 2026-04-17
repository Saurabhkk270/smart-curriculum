import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode, FileSpreadsheet, UserCheck, Calendar, UserPlus, Bell } from 'lucide-react';
import ClassManagement from './ClassManagement';
import QRGenerator from './QRGenerator';
import AttendanceRecords from './AttendanceRecords';
import ManualAttendance from './ManualAttendance';
import TimetableManagement from './TimetableManagement';
import StudentEnrollment from './StudentEnrollment';
import TeacherAnnouncements from './TeacherAnnouncements';
import TodayClassReminders from './TodayClassReminders';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))] p-8 text-white shadow-2xl">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Teacher Dashboard</h1>
            <p className="text-white/95 drop-shadow">Manage your classes, students, and attendance efficiently</p>
          </div>
          <Link to="/classes">
            <Button variant="secondary" className="hover-scale shadow-lg hover:shadow-xl transition-all">Open Classes Area</Button>
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>
      </div>

      <TodayClassReminders />

      {/* Classes Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Classes</CardTitle>
              <CardDescription>Create and manage your classes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ClassManagement />
        </CardContent>
      </Card>

      {/* Students Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Students</CardTitle>
              <CardDescription>Enroll students to your classes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentEnrollment />
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">QR Code</CardTitle>
              <CardDescription>Generate QR codes for attendance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <QRGenerator />
        </CardContent>
      </Card>

      {/* Manual Attendance Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Manual Attendance</CardTitle>
              <CardDescription>Mark attendance manually</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ManualAttendance />
        </CardContent>
      </Card>

      {/* Timetable Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Timetable</CardTitle>
              <CardDescription>Upload and manage timetables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <TimetableManagement />
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Announcements</CardTitle>
              <CardDescription>Send updates to your classes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <TeacherAnnouncements />
        </CardContent>
      </Card>

      {/* Records Section */}
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Attendance Records</CardTitle>
              <CardDescription>View and track attendance history</CardDescription>
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

export default TeacherDashboard;
