import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import StudentTimetableComponent from '@/components/dashboard/StudentTimetable';

const StudentTimetable = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">View your class schedule</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Class Schedule</CardTitle>
          <CardDescription>Your weekly timetable</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentTimetableComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;
