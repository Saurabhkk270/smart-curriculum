import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import ManualAttendance from '@/components/dashboard/ManualAttendance';

const TeacherManual = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Manual Attendance</h1>
          <p className="text-muted-foreground">Mark attendance manually</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Manual Marking</CardTitle>
          <CardDescription>Record attendance without QR codes</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ManualAttendance />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManual;
