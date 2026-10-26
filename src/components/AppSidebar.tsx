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

  return (
    <Sidebar className={cn(isCollapsed ? 'w-14' : 'w-64', "bg-white border-r border-slate-200")} collapsible="icon">
      <SidebarContent className="bg-white overflow-y-auto">
        <SidebarGroup>
          <div className="px-3 py-3 border-b border-slate-200 mb-2 flex items-center justify-between bg-slate-50/70">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="SVSU" className="h-6 w-6 object-contain" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 tracking-tight block leading-none">
                      {role === 'admin' ? 'Admin Suite' : role === 'teacher' ? 'Faculty Portal' : 'Student Portal'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">SVSU ERP</span>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold",
                    role === 'admin' ? 'bg-slate-900 text-white border-slate-900' : role === 'teacher' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-300'
                  )}
                >
                  {roleBadge}
                </Badge>
              </div>
            ) : (
              <div className="mx-auto">
                <img src="/logo.png" alt="SVSU" className="h-6 w-6 object-contain" />
              </div>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 transition-colors"
                      activeClassName="bg-blue-700 text-white font-semibold hover:bg-blue-700 hover:text-white shadow-xs"
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
