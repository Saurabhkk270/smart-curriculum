import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AlertTriangle, Menu, ShieldCheck, Building2, UserCircle2 } from 'lucide-react';

const DashboardLayout = () => {
  const { profile, authError, signOut } = useAuth();
  const role = profile?.role || 'student';

  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
      : role === 'teacher'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';

  const roleLabel =
    role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Faculty Member' : 'Enrolled Student';

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-slate-50/70">
        <AppSidebar />

        <div className="flex-1 flex flex-col w-full min-w-0">
          {/* Executive Institutional Header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white shadow-2xs pt-[env(safe-area-inset-top)]">
            <div className="h-0.5 bg-gradient-to-r from-orange-500 via-white to-green-600" />
            <div className="flex items-center justify-between px-3 sm:px-6 h-16">
              {/* Left Brand Area */}
              <div className="flex items-center gap-3 overflow-hidden">
                <SidebarTrigger className="lg:hidden shrink-0 text-slate-600 hover:text-slate-900">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>

                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                    <img src="/logo.png" alt="University Crest" className="w-full h-full object-contain" />
                  </div>
                  <div className="truncate">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                      Shri Vishwakarma Skill University
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>ERP & Academic Management System</span>
                      <span className="hidden md:inline text-slate-300">•</span>
                      <span className="hidden md:inline text-slate-600 font-semibold">Term: 2026-2027</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Profile & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 gap-1.5 shadow-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Admin Portal</span>
                    </Button>
                  </Link>
                )}

                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-800">
                    {profile?.full_name || 'Academic User'}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${roleBadgeStyle}`}>
                    {roleLabel}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="text-xs text-slate-600 hover:text-slate-900 h-8 px-3 border-slate-200"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Workspace Content */}
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

export default DashboardLayout;
