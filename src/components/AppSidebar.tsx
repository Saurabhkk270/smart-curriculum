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
  UserCheck,
  UserPlus,
  CalendarDays,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();

  const isCollapsed = state === 'collapsed';
  const role = profile?.role || 'student';

  // 1. Admin Items (Only for role === 'admin')
  const adminItems = [
    { title: 'Admin Overview', url: '/admin', icon: LayoutDashboard },
    { title: 'Students Directory', url: '/admin/students', icon: Users },
    { title: 'Faculty & Teachers', url: '/admin/teachers', icon: GraduationCap },
    { title: 'Academics & Courses', url: '/admin/academics', icon: BookOpen },
    { title: 'Master Timetable', url: '/admin/timetable', icon: Calendar },
    { title: 'Attendance Audit', url: '/admin/attendance', icon: ClipboardList },
    { title: 'Examinations', url: '/admin/examinations', icon: FileText },
    { title: 'Progress & GPA', url: '/admin/progress', icon: TrendingUp },
    { title: 'Cohorts & Groups', url: '/admin/groups', icon: UsersRound },
    { title: 'Campus Notices', url: '/admin/notices', icon: BellRing },
    { title: 'Internal Messages', url: '/admin/messages', icon: MessageSquare },
    { title: 'Campus Gallery', url: '/admin/gallery', icon: ImageIcon },
    { title: 'Feedback & Review', url: '/admin/feedback', icon: Star },
    { title: 'Excel Bulk Import', url: '/admin/imports', icon: Download },
    { title: 'Campus AI Copilot', url: '/admin/ai', icon: Bot },
    { title: 'Activity Audit Log', url: '/admin/activity', icon: Activity },
    { title: 'System Settings', url: '/admin/settings', icon: Settings },
  ];

  // 2. Teacher Items (Only for role === 'teacher')
  const teacherItems = [
    { title: 'Classes & Subjects', url: '/dashboard/classes', icon: Users },
    { title: 'Student Enrollment', url: '/dashboard/students', icon: UserPlus },
    { title: 'QR Code Generator', url: '/dashboard/qr-code', icon: QrCode },
    { title: 'Manual Attendance', url: '/dashboard/manual', icon: UserCheck },
    { title: 'Teacher Timetable', url: '/dashboard/timetable', icon: Calendar },
    { title: 'Announcements', url: '/dashboard/announcements', icon: BellRing },
    { title: 'Attendance Records', url: '/dashboard/records', icon: FileSpreadsheet },
  ];

  // 3. Student Items (Only for role === 'student')
  const studentItems = [
    { title: 'QR Scanner', url: '/dashboard/scanner', icon: QrCode },
    { title: 'Attendance Calendar', url: '/dashboard/calendar', icon: CalendarDays },
    { title: 'Class Timetable', url: '/dashboard/timetable', icon: BookOpen },
    { title: 'Announcements', url: '/dashboard/announcements', icon: BellRing },
    { title: 'My Records', url: '/dashboard/records', icon: TrendingUp },
  ];

  // Select items strictly based on user's role
  const items = role === 'admin' ? adminItems : role === 'teacher' ? teacherItems : studentItems;
  const menuTitle = role === 'admin' ? 'Admin Portal' : role === 'teacher' ? 'Faculty Menu' : 'Student Menu';
  const roleBadge = role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Faculty' : 'Student';

  // Dynamic Icon color based on title
  const getIconColor = (title: string, isActive: boolean) => {
    if (isActive) return "text-white";
    if (title.includes("Scanner") || title.includes("QR")) return "text-cyan-400";
    if (title.includes("Calendar") || title.includes("Classes")) return "text-emerald-400";
    if (title.includes("Timetable")) return "text-amber-400";
    if (title.includes("Announcements") || title.includes("Notices")) return "text-rose-400";
    if (title.includes("Records") || title.includes("Progress")) return "text-indigo-400";
    return "text-blue-400";
  };

  return (
    <Sidebar className={cn(isCollapsed ? 'w-16' : 'w-64', "bg-slate-950 border-r border-slate-800/80 text-slate-100 flex flex-col")} collapsible="icon">
      <SidebarContent className="bg-slate-950 text-slate-100 overflow-y-auto flex-1">
        <SidebarGroup>
          {/* Institutional Top Header */}
          <div className="px-3 py-3.5 border-b border-slate-800/90 mb-3 bg-slate-900/60 rounded-lg mx-2 mt-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                    <img src="/logo.png" alt="SVSU" className="h-full w-full object-contain" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-black text-white tracking-tight block leading-tight truncate">
                      {role === 'admin' ? 'SVSU Admin Suite' : role === 'teacher' ? 'Faculty Academic Portal' : 'Student ERP Portal'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold tracking-wide">
                      Haryana Skill University
                    </span>
                  </div>
                </div>
                <Badge 
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border-0",
                    role === 'admin' ? 'bg-purple-600 text-white' : role === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  )}
                >
                  {roleBadge}
                </Badge>
              </div>
            ) : (
              <div className="mx-auto flex justify-center">
                <img src="/logo.png" alt="SVSU" className="h-7 w-7 object-contain bg-white rounded p-0.5" />
              </div>
            )}
          </div>

          <div className="px-3 pb-1 pt-2">
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block px-1">
                {role === 'admin' ? 'University Modules' : role === 'teacher' ? 'Instructional Tools' : 'Academic Services'}
              </span>
            )}
          </div>

          <SidebarGroupContent className="px-1 mt-1">
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="rounded-lg transition-all">
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-xs font-medium transition-all",
                          isActive 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-950/60 ring-1 ring-blue-400/40" 
                            : "text-slate-300 hover:text-white hover:bg-slate-900/90"
                        )}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", getIconColor(item.title, isActive))} />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Mini Profile Footer at bottom of sidebar */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/70 m-2 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border border-white/20">
              {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'SK'}
            </div>
            <div className="overflow-hidden flex-1">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {profile?.full_name || 'Saurabh Kakkar'}
              </span>
              <span className="text-[10px] text-amber-300/90 font-mono block truncate">
                {profile?.student_id || '25UGCSE151'}
              </span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        </div>
      )}
    </Sidebar>
  );
}
