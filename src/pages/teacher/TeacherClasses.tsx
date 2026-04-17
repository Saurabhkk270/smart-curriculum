import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import ClassManagement from '@/components/dashboard/ClassManagement';

const TeacherClasses = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Create and manage your classes</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Class Management</CardTitle>
          <CardDescription>View and organize your classes</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ClassManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherClasses;
