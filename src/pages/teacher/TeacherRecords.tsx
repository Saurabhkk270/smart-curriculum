import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import AttendanceRecords from '@/components/dashboard/AttendanceRecords';

const TeacherRecords = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">View and track attendance history</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">History & Reports</CardTitle>
          <CardDescription>Complete attendance overview</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AttendanceRecords />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherRecords;
