import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  TrendingUp,
  UsersRound,
  MessageSquare,
  BellRing,
  Image as ImageIcon,
  Star,
  Download,
  Bot,
  Activity,
  Settings,
  QrCode,
  CalendarDays,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Students Directory", href: "/admin/students", icon: Users },
  { name: "Faculty & Teachers", href: "/admin/teachers", icon: GraduationCap },
  { name: "Academics & Courses", href: "/admin/academics", icon: BookOpen },
  { name: "Master Timetable", href: "/admin/timetable", icon: Calendar },
  { name: "Attendance Audit", href: "/admin/attendance", icon: ClipboardList },
  { name: "Examinations", href: "/admin/examinations", icon: FileText },
  { name: "Progress & GPA", href: "/admin/progress", icon: TrendingUp },
  { name: "Cohorts & Groups", href: "/admin/groups", icon: UsersRound },
  { name: "Campus Notices", href: "/admin/notices", icon: BellRing },
  { name: "Internal Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Campus Gallery", href: "/admin/gallery", icon: ImageIcon },
  { name: "Feedback & Review", href: "/admin/feedback", icon: Star },
  { name: "Excel Bulk Import", href: "/admin/imports", icon: Download },
  { name: "Campus AI Copilot", href: "/admin/ai", icon: Bot },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Top Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border bg-primary/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-sidebar-foreground">Admin Portal</h2>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary text-primary">10 Phases</Badge>
      </div>

      {/* Switch to Teacher / Student App */}
      <div className="p-2 border-b bg-muted/30">
        <Link
          to="/dashboard/classes"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-md bg-white border shadow-xs text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-primary" />
          <span>Switch to Teacher / Student</span>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Management Modules
          </div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  "group flex items-center px-3 py-2 text-xs rounded-md transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                    "mr-2.5 flex-shrink-0 h-4 w-4"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}

          {/* Quick jump to Teacher/Student tools */}
          <div className="pt-4 pb-1 px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-t mt-3">
            Quick Jump
          </div>
          <Link
            to="/dashboard/classes"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Teacher Classes</span>
          </Link>
          <Link
            to="/dashboard/qr-code"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-600" />
            <span>QR Code Generator</span>
          </Link>
          <Link
            to="/dashboard/scanner"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
          >
            <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
            <span>Student QR Scanner</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
