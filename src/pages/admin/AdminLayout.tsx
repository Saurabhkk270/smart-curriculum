import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AlertTriangle, Menu, ShieldCheck } from 'lucide-react';

const AdminLayout = () => {
  const { profile, authError, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-slate-50/70">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* Executive Administrative Header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white shadow-2xs pt-[env(safe-area-inset-top)]">
            <div className="h-0.5 bg-gradient-to-r from-orange-500 via-white to-green-600" />
            <div className="flex items-center justify-between px-3 sm:px-6 h-16">
              <div className="flex items-center gap-3 overflow-hidden">
                <SidebarTrigger className="lg:hidden shrink-0 text-slate-600 hover:text-slate-900">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                    <img src="/logo.png" alt="University Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                        SVSU Administration Portal
                      </h1>
                      <Badge className="bg-slate-900 text-white text-[10px] px-1.5 py-0 font-normal hidden sm:inline-flex">
                        Superadmin
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Executive Campus Registry & Academic Management • 2026-27
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-800">{profile?.full_name || 'System Administrator'}</span>
                  <span className="text-[10px] text-slate-500">Security Clearance: Level 1</span>
                </div>
                <Button variant="outline" size="sm" onClick={signOut} className="text-xs text-slate-600 hover:text-slate-900 h-8 px-3 border-slate-200">
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
