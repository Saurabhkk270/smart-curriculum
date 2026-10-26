import { useState } from 'react';
import {
  Users,
  QrCode,
  FileSpreadsheet,
  UserCheck,
  Calendar,
  UserPlus,
  Bell,
  BookOpen,
  CalendarDays,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
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

  // Mode: can be student or teacher
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>(
    profile?.role === 'teacher' || profile?.role === 'admin' ? 'teacher' : 'student'
  );

  const teacherItems = [
    { title: 'Classes', url: '/dashboard/classes', icon: Users },
    { title: 'Students', url: '/dashboard/students', icon: UserPlus },
    { title: 'QR Code', url: '/dashboard/qr-code', icon: QrCode },
    { title: 'Manual Attendance', url: '/dashboard/manual', icon: UserCheck },
    { title: 'Timetable', url: '/dashboard/timetable', icon: Calendar },
    { title: 'Announcements', url: '/dashboard/announcements', icon: Bell },
    { title: 'Records', url: '/dashboard/records', icon: FileSpreadsheet },
  ];

  const studentItems = [
    { title: 'Scanner', url: '/dashboard/scanner', icon: QrCode },
    { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarDays },
    { title: 'Timetable', url: '/dashboard/timetable', icon: BookOpen },
    { title: 'Announcements', url: '/dashboard/announcements', icon: Bell },
    { title: 'Records', url: '/dashboard/records', icon: TrendingUp },
  ];

  const items = viewMode === 'teacher' ? teacherItems : studentItems;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={cn(isCollapsed ? 'w-14' : 'w-64', "bg-white border-r border-border")} collapsible="icon">
      <SidebarContent className="bg-white">
        {/* Admin Portal Direct Launch Button */}
        {!isCollapsed && (
          <div className="p-3 border-b bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent">
            <Link
              to="/admin"
              className="flex items-center justify-between p-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Portal</span>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white font-normal">
                16 Modules
              </Badge>
            </Link>
          </div>
        )}

        {/* View Mode Toggle: Teacher vs Student */}
        {!isCollapsed && (
          <div className="px-3 pt-3">
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium">
              <button
                type="button"
                className={cn(
                  "py-1.5 px-2 rounded-md transition-all",
                  viewMode === 'teacher' ? "bg-white text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode('teacher')}
              >
                Teacher
              </button>
              <button
                type="button"
                className={cn(
                  "py-1.5 px-2 rounded-md transition-all",
                  viewMode === 'student' ? "bg-white text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode('student')}
              >
                Student
              </button>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground font-semibold text-xs uppercase tracking-wider px-3">
            {!isCollapsed && `${viewMode === 'teacher' ? 'Faculty' : 'Student'} Features`}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="text-foreground hover:bg-muted hover:text-foreground"
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 w-full"
                      activeClassName="bg-primary text-primary-foreground font-medium hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 text-foreground" />
                      {!isCollapsed && <span>{item.title}</span>}
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
