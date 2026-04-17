import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import TimetableManagement from '@/components/dashboard/TimetableManagement';

const TeacherTimetable = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">Upload and manage timetables</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Timetable Management</CardTitle>
          <CardDescription>Manage class schedules</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TimetableManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherTimetable;
