import { Outlet } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
const DashboardLayout = () => {
  const {
    profile,
    signOut
  } = useAuth();
  return <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-card shadow-sm pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between px-2 sm:px-4 h-14 sm:h-16">
              <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                <SidebarTrigger className="lg:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                
                <div className="flex items-center gap-2 sm:gap-4 transition-transform hover:scale-[1.01] overflow-hidden">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-lg p-1 sm:p-1.5 overflow-hidden shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
                  </div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text font-sans text-transparent tracking-tight drop-shadow-sm truncate">
                    Smart Curriculum
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <span className="text-xs sm:text-sm font-medium hidden md:inline">{profile?.full_name}</span>
                <Button variant="outline" size="sm" onClick={signOut} className="text-xs sm:text-sm h-8 px-2 sm:px-3">
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default DashboardLayout;