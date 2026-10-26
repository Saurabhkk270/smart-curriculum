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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Teachers", href: "/admin/teachers", icon: GraduationCap },
  { name: "Academics", href: "/admin/academics", icon: BookOpen },
  { name: "Timetable", href: "/admin/timetable", icon: Calendar },
  { name: "Attendance", href: "/admin/attendance", icon: ClipboardList },
  { name: "Examinations", href: "/admin/examinations", icon: FileText },
  { name: "Progress Reports", href: "/admin/progress", icon: TrendingUp },
  { name: "Groups", href: "/admin/groups", icon: UsersRound },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Notices", href: "/admin/notices", icon: BellRing },
  { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { name: "Feedback", href: "/admin/feedback", icon: Star },
  { name: "Imports", href: "/admin/imports", icon: Download },
  { name: "AI Assistant", href: "/admin/ai", icon: Bot },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Admin Portal</h2>
        <Link
          to="/dashboard/classes"
          className="text-xs text-primary hover:underline font-medium"
        >
          App View →
        </Link>
      </div>
      <div className="p-2 border-b">
        <Link
          to="/dashboard/classes"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-md bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
        >
          <span>← Back to Classes / Scanner</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                    "mr-3 flex-shrink-0 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
