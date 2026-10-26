import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { BiometricGate } from "./components/BiometricGate";
import { RoleRoute } from "./components/RoleRoute";

// Lazy load all page components
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Classes = lazy(() => import("./pages/Classes"));
const ClassDetails = lazy(() => import("./pages/ClassDetails"));
const TeacherClasses = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherQRCode = lazy(() => import("./pages/teacher/TeacherQRCode"));
const TeacherManual = lazy(() => import("./pages/teacher/TeacherManual"));
const TeacherTimetable = lazy(() => import("./pages/teacher/TeacherTimetable"));
const TeacherAnnouncements = lazy(() => import("./pages/teacher/TeacherAnnouncements"));
const TeacherRecords = lazy(() => import("./pages/teacher/TeacherRecords"));
const StudentScanner = lazy(() => import("./pages/student/StudentScanner"));
const StudentCalendar = lazy(() => import("./pages/student/StudentCalendar"));
const StudentTimetable = lazy(() => import("./pages/student/StudentTimetable"));
const StudentAnnouncements = lazy(() => import("./pages/student/StudentAnnouncements"));
const StudentRecords = lazy(() => import("./pages/student/StudentRecords"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminTeachers = lazy(() => import("./pages/admin/AdminTeachers"));
const AdminImports = lazy(() => import("./pages/admin/AdminImports"));
const AdminAcademics = lazy(() => import("./pages/admin/AdminAcademics"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminExaminations = lazy(() => import("./pages/admin/AdminExaminations"));
const AdminProgress = lazy(() => import("./pages/admin/AdminProgress"));
const AdminTimetable = lazy(() => import("./pages/admin/AdminTimetable"));
const AdminAttendance = lazy(() => import("./pages/admin/AdminAttendance"));
const AdminGroups = lazy(() => import("./pages/admin/AdminGroups"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  const { profile, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const teacherRoles = ['teacher', 'admin'] as const;
  const studentRoles = ['student'] as const;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="classes" element={<RoleRoute allow={[...teacherRoles]}><TeacherClasses /></RoleRoute>} />
          <Route path="students" element={<RoleRoute allow={[...teacherRoles]}><TeacherStudents /></RoleRoute>} />
          <Route path="qr-code" element={<RoleRoute allow={[...teacherRoles]}><TeacherQRCode /></RoleRoute>} />
          <Route path="manual" element={<RoleRoute allow={[...teacherRoles]}><TeacherManual /></RoleRoute>} />
          <Route 
            path="timetable" 
            element={isTeacher ? <TeacherTimetable /> : <StudentTimetable />} 
          />
          <Route 
            path="announcements" 
            element={isTeacher ? <TeacherAnnouncements /> : <StudentAnnouncements />} 
          />
          <Route 
            path="records" 
            element={isTeacher ? <TeacherRecords /> : <StudentRecords />} 
          />
          <Route path="scanner" element={<RoleRoute allow={[...studentRoles]}><StudentScanner /></RoleRoute>} />
          <Route path="calendar" element={<RoleRoute allow={[...studentRoles]}><StudentCalendar /></RoleRoute>} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute><RoleRoute allow={['admin']}><AdminLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="academics" element={<AdminAcademics />} />
          <Route path="timetable" element={<AdminTimetable />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="examinations" element={<AdminExaminations />} />
          <Route path="progress" element={<AdminProgress />} />
          <Route path="groups" element={<AdminGroups />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="imports" element={<AdminImports />} />
          <Route path="ai" element={<AdminAI />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
        <Route path="/classes/:id" element={<ProtectedRoute><ClassDetails /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BiometricGate>
            <AppRoutes />
          </BiometricGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
