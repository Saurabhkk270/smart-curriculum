import { Users, QrCode, FileSpreadsheet, UserCheck, Calendar, UserPlus, Bell, BookOpen, CalendarDays, TrendingUp } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
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

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  
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

  const items = isTeacher ? teacherItems : studentItems;
  const currentPath = location.pathname;
  
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent className="bg-transparent border-r border-border">
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground font-semibold text-base">
            {!isCollapsed && (isTeacher ? 'Teacher Menu' : 'Student Menu')}
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
