import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, Megaphone } from 'lucide-react';
import TeacherAnnouncementsComponent from '@/components/dashboard/TeacherAnnouncements';

const TeacherAnnouncements = () => {
  return (
    <div className="space-y-6">
      {/* Official SVSU Faculty Announcements Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Departmental Circulars
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Session 2026-2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-blue-700" />
              Faculty Announcements & Class Broadcasts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Shri Vishwakarma Skill University • Publish Notifications, Assignment Deadlines & Exam Updates
            </p>
          </div>
        </div>
      </div>
      
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-5">
          <CardTitle className="text-base font-bold text-slate-900">Broadcast Notice Composer</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Publish circulars directly to enrolled class cohorts. Notifications appear immediately on student dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TeacherAnnouncementsComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAnnouncements;
