import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import AttendanceCalendar from '@/components/dashboard/AttendanceCalendar';

const StudentCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Attendance Calendar</h1>
          <p className="text-muted-foreground">View your attendance history by date</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Monthly Overview</CardTitle>
          <CardDescription>Track your attendance patterns</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceCalendar />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentCalendar;
