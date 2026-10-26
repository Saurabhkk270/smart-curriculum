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
          <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white shadow-xs pt-[env(safe-area-inset-top)]">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600" />
            <div className="flex items-center justify-between px-3 sm:px-6 h-18 py-2">
              {/* Left Brand Area */}
              <div className="flex items-center gap-3 overflow-hidden">
                <SidebarTrigger className="lg:hidden shrink-0 text-slate-700 hover:text-slate-900">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>

                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center p-1 shadow-sm shrink-0">
                    <img src="/logo.png" alt="University Crest" className="w-full h-full object-contain" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                        श्री विश्वकर्मा कौशल विश्वविद्यालय
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                        Govt. of Haryana
                      </span>
                    </div>
                    <h1 className="text-sm sm:text-base font-black text-slate-950 tracking-tight leading-tight truncate">
                      SHRI VISHWAKARMA SKILL UNIVERSITY
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>Integrated University ERP Portal (IUMS)</span>
                      <span className="hidden md:inline text-slate-300">•</span>
                      <span className="hidden md:inline text-blue-700 font-semibold">Term: 2026-2027</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Profile & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Campus Verified
                  </span>
                </div>

                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 gap-1.5 shadow-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span>Admin Portal</span>
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'SK'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {profile?.full_name || 'Saurabh Kakkar'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {profile?.student_id || '25UGCSE151'} • {roleLabel}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8 px-3 border-slate-300 font-medium"
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
