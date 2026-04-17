import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import StudentAnnouncementsComponent from '@/components/dashboard/StudentAnnouncements';

const StudentAnnouncements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with class announcements</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Class Updates</CardTitle>
          <CardDescription>Important notifications from teachers</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentAnnouncementsComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAnnouncements;
