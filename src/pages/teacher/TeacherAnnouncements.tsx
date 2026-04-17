import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import TeacherAnnouncementsComponent from '@/components/dashboard/TeacherAnnouncements';

const TeacherAnnouncements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Send updates to your classes</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Class Updates</CardTitle>
          <CardDescription>Communicate with students</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TeacherAnnouncementsComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAnnouncements;
