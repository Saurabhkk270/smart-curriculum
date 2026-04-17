import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import StudentEnrollment from '@/components/dashboard/StudentEnrollment';

const TeacherStudents = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Enroll students to your classes</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Student Enrollment</CardTitle>
          <CardDescription>Add students to your classes</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentEnrollment />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudents;
