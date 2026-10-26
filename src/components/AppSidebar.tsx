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
  Sparkles,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link, useLocation } from 'react-router-dom';
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

  // 1. Admin Modules (Phases 6 - 10)
  const adminItems = [
    { title: 'Admin Overview', url: '/admin', icon: LayoutDashboard, badge: 'Main' },
    { title: 'Students Directory', url: '/admin/students', icon: Users },
    { title: 'Faculty & Teachers', url: '/admin/teachers', icon: GraduationCap },
    { title: 'Academics & Courses', url: '/admin/academics', icon: BookOpen },
    { title: 'Master Timetable', url: '/admin/timetable', icon: Calendar },
    { title: 'Attendance Audit', url: '/admin/attendance', icon: ClipboardList, badge: 'Excel' },
    { title: 'Examinations', url: '/admin/examinations', icon: FileText },
    { title: 'Progress & GPA', url: '/admin/progress', icon: TrendingUp },
    { title: 'Cohorts & Groups', url: '/admin/groups', icon: UsersRound },
    { title: 'Campus Notices', url: '/admin/notices', icon: BellRing },
    { title: 'Internal Messages', url: '/admin/messages', icon: MessageSquare },
    { title: 'Campus Gallery', url: '/admin/gallery', icon: ImageIcon },
    { title: 'Feedback & Review', url: '/admin/feedback', icon: Star },
    { title: 'Excel Bulk Import', url: '/admin/imports', icon: Download },
    { title: 'Campus AI Copilot', url: '/admin/ai', icon: Bot, badge: 'AI' },
    { title: 'Activity Audit Log', url: '/admin/activity', icon: Activity },
    { title: 'System Settings', url: '/admin/settings', icon: Settings },
  ];

  // 2. Teacher Modules
  const teacherItems = [
    { title: 'Classes & Subjects', url: '/dashboard/classes', icon: Users },
    { title: 'Student Enrollment', url: '/dashboard/students', icon: UserPlus },
    { title: 'QR Code Generator', url: '/dashboard/qr-code', icon: QrCode },
    { title: 'Manual Attendance', url: '/dashboard/manual', icon: UserCheck },
    { title: 'Teacher Timetable', url: '/dashboard/timetable', icon: Calendar },
    { title: 'Announcements', url: '/dashboard/announcements', icon: BellRing },
    { title: 'Attendance Records', url: '/dashboard/records', icon: FileSpreadsheet },
  ];

  // 3. Student Modules
  const studentItems = [
    { title: 'QR Scanner', url: '/dashboard/scanner', icon: QrCode },
    { title: 'Attendance Calendar', url: '/dashboard/calendar', icon: CalendarDays },
    { title: 'Class Timetable', url: '/dashboard/timetable', icon: BookOpen },
    { title: 'My Records', url: '/dashboard/records', icon: TrendingUp },
  ];

  return (
    <Sidebar className={cn(isCollapsed ? 'w-14' : 'w-64', "bg-white border-r border-border")} collapsible="icon">
      <SidebarContent className="bg-white overflow-y-auto">
        {/* Top Header Banner */}
        {!isCollapsed && (
          <div className="p-3 border-b bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent">
            <Link
              to="/admin"
              className="flex items-center justify-between p-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Portal</span>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white font-normal">
                10 Phases Live
              </Badge>
            </Link>
          </div>
        )}

        {/* 1. ADMIN SECTION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold text-xs uppercase tracking-wider px-3 flex items-center justify-between">
            {!isCollapsed && (
              <>
                <span>Admin Portal (All Phases)</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary">16</Badge>
              </>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-foreground hover:bg-primary/10 hover:text-primary">
                    <NavLink
                      to={item.url}
                      className="flex items-center justify-between w-full"
                      activeClassName="bg-primary text-primary-foreground font-medium hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setOpenMobile(false)}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-xs">{item.title}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground">{item.badge}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 2. TEACHER SECTION */}
        <SidebarGroup className="border-t pt-2 mt-2">
          <SidebarGroupLabel className="text-emerald-700 font-bold text-xs uppercase tracking-wider px-3 flex items-center justify-between">
            {!isCollapsed && (
              <>
                <span>Teacher Tools</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-700 border-emerald-300">Faculty</Badge>
              </>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teacherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-foreground hover:bg-emerald-50 hover:text-emerald-800">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 w-full"
                      activeClassName="bg-emerald-600 text-white font-medium hover:bg-emerald-600 hover:text-white"
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-xs">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. STUDENT SECTION */}
        <SidebarGroup className="border-t pt-2 mt-2 pb-6">
          <SidebarGroupLabel className="text-blue-700 font-bold text-xs uppercase tracking-wider px-3 flex items-center justify-between">
            {!isCollapsed && (
              <>
                <span>Student Tools</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-blue-700 border-blue-300">Learner</Badge>
              </>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-foreground hover:bg-blue-50 hover:text-blue-800">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 w-full"
                      activeClassName="bg-blue-600 text-white font-medium hover:bg-blue-600 hover:text-white"
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-xs">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
