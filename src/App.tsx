import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { BiometricGate } from "./components/BiometricGate";

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

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="qr-code" element={<TeacherQRCode />} />
          <Route path="manual" element={<TeacherManual />} />
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
          <Route path="scanner" element={<StudentScanner />} />
          <Route path="calendar" element={<StudentCalendar />} />
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
