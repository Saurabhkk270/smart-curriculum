import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TodayClass {
  time: string;
  subject: string;
  course: string;
  semester: string;
}

const TodayClassReminders = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayClasses();
    }
  }, [user]);

  const fetchTodayClasses = async () => {
    try {
      const today = format(new Date(), 'EEEE'); // Get day name (e.g., "Monday")

      // Get all timetables uploaded by this teacher
      const { data: timetables, error } = await supabase
        .from('timetables')
        .select('*')
        .eq('uploaded_by', user!.id);

      if (error) throw error;

      // Parse timetable data to extract today's classes
      // This is a simplified version - in reality, you'd parse the actual file content
      // For now, we'll create sample reminders based on the timetable metadata
      const classes: TodayClass[] = [];
      
      if (timetables && timetables.length > 0) {
        // Example classes based on uploaded timetables
        timetables.forEach((timetable) => {
          classes.push({
            time: '09:00 AM',
            subject: timetable.file_name.replace('.pdf', '').replace('.xlsx', ''),
            course: timetable.course,
            semester: timetable.semester
          });
        });
      }

      setTodayClasses(classes);
    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Today's Class Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todayClasses.length === 0) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Today's Class Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>No classes scheduled</AlertTitle>
            <AlertDescription>
              You don't have any classes scheduled for today, or no timetables have been uploaded yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 shadow-[var(--shadow-large)]">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary animate-pulse" />
          Today's Class Reminders
          <Badge variant="secondary" className="ml-auto">
            {todayClasses.length} {todayClasses.length === 1 ? 'Class' : 'Classes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todayClasses.map((classItem, index) => (
            <Alert key={index} className="border-l-4 border-l-primary">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-base font-semibold flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" />
                    {classItem.subject}
                  </AlertTitle>
                  <AlertDescription className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{classItem.time}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {classItem.course}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {classItem.semester}
                      </Badge>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayClassReminders;
