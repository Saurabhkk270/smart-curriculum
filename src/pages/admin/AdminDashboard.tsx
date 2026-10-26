import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  ClipboardList,
  BellRing,
  FileText,
  TrendingUp,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

const AdminDashboard = () => {
  // 1. Fetch Students Count
  const { data: studentsCount = 0 } = useQuery({
    queryKey: ["admin_stats_students"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
      if (error) return 0;
      return count || 0;
    },
  });

  // 2. Fetch Teachers Count
  const { data: teachersCount = 0 } = useQuery({
    queryKey: ["admin_stats_teachers"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");
      if (error) return 0;
      return count || 0;
    },
  });

  // 3. Fetch Classes Count
  const { data: classesCount = 0 } = useQuery({
    queryKey: ["admin_stats_classes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  // 4. Fetch Pending Accounts Count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin_stats_pending"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("account_status", "pending");
      if (error) return 0;
      return count || 0;
    },
  });

  // 5. Fetch Attendance Sessions Count (Total & Today)
  const { data: attendanceSessionsCount = 0 } = useQuery({
    queryKey: ["admin_stats_attendance_sessions"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("attendance_sessions")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  // 6. Fetch Total Attendance Marked
  const { data: attendanceRecordsCount = 0 } = useQuery({
    queryKey: ["admin_stats_attendance_records"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  // 7. Fetch Recent Notices
  const { data: recentNotices = [] } = useQuery({
    queryKey: ["admin_recent_notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) return [];
      return data || [];
    },
  });

  // 8. Fetch Recent Attendance Sessions with Class Info
  const { data: recentSessions = [] } = useQuery({
    queryKey: ["admin_recent_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(`
          id,
          session_date,
          session_time,
          classes (
            name,
            code
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Admin Portal</h2>
            <Badge variant="outline" className="text-primary border-primary font-medium">
              SVSU Campus Management
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time overview of academics, students, attendance operations, and campus alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/imports">
              <Download className="h-4 w-4 mr-2" />
              Bulk Import
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/notices">
              <BellRing className="h-4 w-4 mr-2" />
              Post Notice
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Active student profiles
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teachersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assigned professors & teachers
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active course subjects
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {pendingCount > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Needs review
                </>
              ) : (
                "All accounts activated"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Attendance Operations</CardTitle>
              <CardDescription>Live session status</CardDescription>
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Recorded Sessions:</span>
              <span className="font-semibold">{attendanceSessionsCount}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Scanned Records:</span>
              <span className="font-semibold">{attendanceRecordsCount}</span>
            </div>
            <div className="pt-1">
              <Button asChild variant="link" className="px-0 text-sm h-auto flex items-center gap-1">
                <Link to="/admin/attendance">
                  Open Attendance Audit <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Exams & Grading</CardTitle>
              <CardDescription>Evaluations & terms</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure midterm exams, grade sheets, and generate cumulative academic progress reports.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="w-1/2">
                <Link to="/admin/examinations">Exams</Link>
              </Button>
              <Button asChild size="sm" className="w-1/2">
                <Link to="/admin/progress">Report Cards</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Campus AI Assistant
              </CardTitle>
              <CardDescription>Automated insights & help</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate attendance anomaly reports, draft campus notices, or analyze class performance with AI.
            </p>
            <Button asChild size="sm" className="w-full">
              <Link to="/admin/ai">Launch AI Copilot</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Hub */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Administration Hub</CardTitle>
          <CardDescription>Direct navigation to system modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/students">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-medium">Students</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/teachers">
                <GraduationCap className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-medium">Teachers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/academics">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <span className="text-xs font-medium">Academics</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/timetable">
                <Calendar className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-medium">Timetable</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/attendance">
                <ClipboardList className="h-5 w-5 text-cyan-500" />
                <span className="text-xs font-medium">Attendance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/examinations">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="text-xs font-medium">Exams</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/progress">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-medium">Progress</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/groups">
                <Layers className="h-5 w-5 text-orange-500" />
                <span className="text-xs font-medium">Groups</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/notices">
                <BellRing className="h-5 w-5 text-pink-500" />
                <span className="text-xs font-medium">Notices</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/imports">
                <Download className="h-5 w-5 text-teal-500" />
                <span className="text-xs font-medium">Imports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/activity">
                <Clock className="h-5 w-5 text-slate-500" />
                <span className="text-xs font-medium">Activity Log</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:border-primary">
              <Link to="/admin/settings">
                <Layers className="h-5 w-5 text-gray-500" />
                <span className="text-xs font-medium">Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notices & Activity Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Notices Board */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Campus Notices</CardTitle>
              <CardDescription>Latest circulars sent to students & staff</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/notices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No notices published yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{n.title}</span>
                        {n.is_pinned && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Pinned
                          </Badge>
                        )}
                        <Badge
                          variant={n.priority === "urgent" ? "destructive" : "outline"}
                          className="text-[10px] px-1.5 py-0 capitalize"
                        >
                          {n.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.content}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Class Sessions</CardTitle>
              <CardDescription>Latest QR sessions conducted</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/attendance">View Audit</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent attendance sessions found.
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => {
                  const classData = s.classes as { name?: string; code?: string } | null;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {classData?.code?.slice(0, 3) || "CLS"}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {classData?.name || "Scheduled Class"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Date: {s.session_date} at {s.session_time}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
